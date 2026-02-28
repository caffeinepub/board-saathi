import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Plus, CheckCircle, Circle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useGetSubjects,
  useGetChapters,
  useAddChapter,
  useMarkChapterCompleted,
} from '../hooks/useQueries';
import NotesSection from '../components/NotesSection';
import QuestionsSection from '../components/QuestionsSection';
import type { Chapter } from '../backend';

export default function ChaptersPage() {
  const { subjectId } = useParams({ from: '/layout/subjects/$subjectId' });
  const navigate = useNavigate();
  const subjectIdBig = BigInt(subjectId);

  const { data: subjects = [] } = useGetSubjects();
  const { data: chapters = [], isLoading } = useGetChapters(subjectIdBig);
  const addChapterMutation = useAddChapter();
  const markCompletedMutation = useMarkChapterCompleted();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [weightage, setWeightage] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const subject = subjects.find((s) => s.id === subjectIdBig);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addChapterMutation.mutateAsync({
      subjectId: subjectIdBig,
      name: name.trim(),
      weightage: BigInt(parseInt(weightage, 10) || 0),
    });
    setName('');
    setWeightage('');
    setOpen(false);
  };

  const handleToggleComplete = async (chapterId: bigint, completed: boolean) => {
    await markCompletedMutation.mutateAsync({
      chapterId,
      completed: !completed,
      subjectId: subjectIdBig,
    });
  };

  const completedCount = chapters.filter((c) => c.completed).length;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate({ to: '/subjects' })}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{subject?.name ?? 'Subject'}</h1>
          <p className="text-xs text-gray-400">
            {completedCount}/{chapters.length} chapters completed
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus size={14} className="mr-1" />
              Add Chapter
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Chapter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="chapter-name">Chapter Name *</Label>
                <Input
                  id="chapter-name"
                  placeholder="e.g., Real Numbers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="chapter-weightage">Weightage (%)</Label>
                <Input
                  id="chapter-weightage"
                  type="number"
                  placeholder="e.g., 10"
                  value={weightage}
                  onChange={(e) => setWeightage(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleAdd}
                disabled={addChapterMutation.isPending || !name.trim()}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {addChapterMutation.isPending ? 'Adding...' : 'Add Chapter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress bar */}
      {chapters.length > 0 && (
        <div className="mb-6 bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-teal-600 font-semibold">
              {Math.round((completedCount / chapters.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all"
              style={{ width: `${(completedCount / chapters.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Chapters list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : chapters.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No chapters yet</h3>
          <p className="text-sm text-gray-400">Add your first chapter to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter: Chapter) => {
            const idStr = String(chapter.id);
            const isExpanded = expandedId === idStr;
            return (
              <div
                key={idStr}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => handleToggleComplete(chapter.id, chapter.completed)}
                    className="flex-shrink-0"
                  >
                    {chapter.completed ? (
                      <CheckCircle size={22} className="text-teal-500" />
                    ) : (
                      <Circle size={22} className="text-gray-300" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${chapter.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {chapter.name}
                    </p>
                    {Number(chapter.weightage) > 0 && (
                      <p className="text-xs text-gray-400">{String(chapter.weightage)}% weightage</p>
                    )}
                  </div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : idStr)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <Tabs defaultValue="notes" className="w-full">
                      <TabsList className="w-full rounded-none border-b border-gray-100 bg-gray-50">
                        <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
                        <TabsTrigger value="questions" className="flex-1">Questions</TabsTrigger>
                      </TabsList>
                      <TabsContent value="notes" className="p-4">
                        <NotesSection chapterId={chapter.id} />
                      </TabsContent>
                      <TabsContent value="questions" className="p-4">
                        <QuestionsSection chapterId={chapter.id} subjectId={subjectIdBig} />
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
