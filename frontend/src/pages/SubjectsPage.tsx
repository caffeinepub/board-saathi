import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useGetSubjects, useAddSubject, useGetAllChapters } from '../hooks/useQueries';

const SUBJECT_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500',
  'bg-yellow-500', 'bg-cyan-500',
];

const SUBJECT_ICONS = ['📐', '📖', '🔬', '🌍', '🕉️', '💻', '🎨', '🏛️', '🧮', '📚'];

export default function SubjectsPage() {
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const { data: subjects = [], isLoading: subjectsLoading } = useGetSubjects();
  const { data: allChapters = [] } = useGetAllChapters();
  const addSubjectMutation = useAddSubject();

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      toast.error('Please enter a subject name');
      return;
    }
    try {
      await addSubjectMutation.mutateAsync(newSubjectName.trim());
      toast.success(`Subject "${newSubjectName.trim()}" added!`);
      setNewSubjectName('');
      setAddOpen(false);
    } catch (err) {
      toast.error('Failed to add subject');
    }
  };

  const getSubjectProgress = (subjectId: number) => {
    const chapters = allChapters.filter(c => c.subjectId === subjectId);
    if (chapters.length === 0) return { total: 0, completed: 0, percent: 0 };
    const completed = chapters.filter(c => c.completed).length;
    return { total: chapters.length, completed, percent: Math.round((completed / chapters.length) * 100) };
  };

  if (subjectsLoading) {
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
          <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
          <p className="text-muted-foreground text-sm mt-1">{subjects.length} subject{subjects.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Subject
        </Button>
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No subjects yet</h3>
          <p className="text-muted-foreground mb-4">Add your first subject to get started</p>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />Add Subject
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject, index) => {
            const progress = getSubjectProgress(subject.id);
            const colorClass = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
            const icon = SUBJECT_ICONS[index % SUBJECT_ICONS.length];
            return (
              <Card
                key={subject.id}
                className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 border-0 shadow-sm"
                onClick={() => navigate({ to: '/subjects/$subjectId', params: { subjectId: subject.id.toString() } })}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center text-2xl`}>
                      {icon}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground mt-1" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 leading-tight">{subject.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {progress.completed}/{progress.total} chapters completed
                  </p>
                  <Progress value={progress.percent} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">{progress.percent}% complete</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Subject Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>Enter the name of the subject you want to add.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                placeholder="e.g., Mathematics, Science..."
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setNewSubjectName(''); }}>Cancel</Button>
            <Button onClick={handleAddSubject} disabled={addSubjectMutation.isPending}>
              {addSubjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
