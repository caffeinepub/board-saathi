import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { BookOpen, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useGetSubjects, useAddSubject, useGetProgressSummary } from '../hooks/useQueries';
import type { Subject } from '../backend';

const SUBJECT_COLORS = [
  'bg-blue-50 text-blue-600 border-blue-100',
  'bg-green-50 text-green-600 border-green-100',
  'bg-purple-50 text-purple-600 border-purple-100',
  'bg-orange-50 text-orange-600 border-orange-100',
  'bg-pink-50 text-pink-600 border-pink-100',
  'bg-teal-50 text-teal-600 border-teal-100',
];

export default function SubjectsPage() {
  const navigate = useNavigate();
  const { data: subjects = [], isLoading } = useGetSubjects();
  const { data: progress } = useGetProgressSummary();
  const addSubject = useAddSubject();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const getSubjectProgress = (subjectId: bigint) => {
    return progress?.subjectProgress.find((sp) => sp.subjectId === subjectId);
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addSubject.mutateAsync(name.trim());
    setName('');
    setOpen(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your chapter progress per subject</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus size={14} className="mr-1" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Subject</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                placeholder="Subject name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Button
                onClick={handleAdd}
                disabled={addSubject.isPending || !name.trim()}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {addSubject.isPending ? 'Adding...' : 'Add Subject'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No subjects yet</h3>
          <p className="text-sm text-gray-400">Add your first subject to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subjects.map((subject: Subject, idx) => {
            const colorClass = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
            const sp = getSubjectProgress(subject.id);
            const total = Number(sp?.totalChapters ?? 0);
            const completed = Number(sp?.completedChapters ?? 0);
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <button
                key={String(subject.id)}
                onClick={() => navigate({ to: '/subjects/$subjectId', params: { subjectId: String(subject.id) } })}
                className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorClass}`}>
                    <BookOpen size={18} />
                  </div>
                  <ChevronRight size={16} className="text-gray-300 mt-1" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mb-1">{subject.name}</h3>
                <p className="text-xs text-gray-400 mb-2">{completed}/{total} chapters</p>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
