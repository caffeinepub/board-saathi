import { useState, useEffect } from 'react';
import { Plus, RotateCcw, Shuffle, CheckCircle2, Trash2, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  useGetAllFlashcards,
  useGetSubjects,
  useGetAllChapters,
  useAddFlashcard,
  useMarkFlashcardLearned,
  useDeleteFlashcard,
} from '../hooks/useQueries';
import type { Flashcard } from '../backend';

function FlashCard({
  card,
  onLearn,
  onDelete,
}: {
  card: Flashcard;
  onLearn: (learned: boolean) => void;
  onDelete: () => void;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="relative">
      <div
        className={`cursor-pointer rounded-xl border-2 transition-all min-h-[160px] flex flex-col ${
          card.learned
            ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20'
            : 'border-border hover:border-primary/50'
        }`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="flex-1 flex items-center justify-center p-5 text-center">
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
              {flipped ? 'Answer' : 'Question'}
            </p>
            <p className="text-sm font-medium">{flipped ? card.back : card.front}</p>
          </div>
        </div>
        <div className="px-4 pb-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            Tap to flip
          </p>
          {card.learned && (
            <Badge variant="secondary" className="text-xs">
              Learned
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          variant={card.learned ? 'outline' : 'default'}
          className="flex-1 gap-1 text-xs"
          onClick={() => onLearn(!card.learned)}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {card.learned ? 'Mark Unlearned' : 'Mark Learned'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const { data: allFlashcards = [], isLoading } = useGetAllFlashcards();
  const { data: subjects = [] } = useGetSubjects();
  const { data: allChapters = [] } = useGetAllChapters();
  const addFlashcard = useAddFlashcard();
  const markLearned = useMarkFlashcardLearned();
  const deleteFlashcard = useDeleteFlashcard();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');

  useEffect(() => {
    let filtered = [...allFlashcards];
    if (filterSubjectId !== 'all') {
      const filterBig = BigInt(filterSubjectId);
      filtered = filtered.filter((f) => f.subjectId === filterBig);
    }
    setCards(filtered);
  }, [allFlashcards, filterSubjectId]);

  const chaptersForSelected = allChapters.filter((c) =>
    selectedSubjectId ? c.subjectId === BigInt(selectedSubjectId) : false
  );

  const handleShuffle = () => {
    setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleLearn = (cardId: bigint, chapterId: bigint, learned: boolean) => {
    markLearned.mutate({ cardId, learned, chapterId });
  };

  const handleDelete = (cardId: bigint, chapterId: bigint) => {
    deleteFlashcard.mutate({ cardId, chapterId });
  };

  const handleAdd = async () => {
    if (!front.trim() || !back.trim()) {
      toast.error('Please enter both front and back text');
      return;
    }
    if (!selectedSubjectId) {
      toast.error('Please select a subject');
      return;
    }
    if (!selectedChapterId) {
      toast.error('Please select a chapter');
      return;
    }
    try {
      await addFlashcard.mutateAsync({
        chapterId: BigInt(selectedChapterId),
        subjectId: BigInt(selectedSubjectId),
        front: front.trim(),
        back: back.trim(),
      });
      toast.success('Flashcard added!');
      setFront('');
      setBack('');
      setAddOpen(false);
    } catch {
      toast.error('Failed to add flashcard');
    }
  };

  const learnedCount = cards.filter((c) => c.learned).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {learnedCount}/{cards.length} learned
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShuffle} className="gap-1">
            <Shuffle className="w-4 h-4" />
            Shuffle
          </Button>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Card
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={String(s.id)} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-16">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
          <p className="text-muted-foreground mb-4">Create flashcards to boost your revision</p>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Flashcard
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <FlashCard
              key={String(card.id)}
              card={card}
              onLearn={(learned) => handleLearn(card.id, card.chapterId, learned)}
              onDelete={() => handleDelete(card.id, card.chapterId)}
            />
          ))}
        </div>
      )}

      {/* Add Flashcard Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Flashcard</DialogTitle>
            <DialogDescription>Create a new flashcard for quick revision.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={(v) => {
                  setSelectedSubjectId(v);
                  setSelectedChapterId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={String(s.id)} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chapter *</Label>
              <Select
                value={selectedChapterId}
                onValueChange={setSelectedChapterId}
                disabled={!selectedSubjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chaptersForSelected.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-front">Front (Question/Term) *</Label>
              <Textarea
                id="card-front"
                placeholder="Enter question or term..."
                value={front}
                onChange={(e) => setFront(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-back">Back (Answer/Definition) *</Label>
              <Textarea
                id="card-back"
                placeholder="Enter answer or definition..."
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                setFront('');
                setBack('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={addFlashcard.isPending}>
              {addFlashcard.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Add Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
