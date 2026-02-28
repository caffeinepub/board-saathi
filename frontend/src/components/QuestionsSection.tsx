import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useGetQuestions, useAddQuestion, useDeleteQuestion } from '../hooks/useQueries';
import type { Question } from '../backend';

interface QuestionsSectionProps {
  chapterId: bigint;
  subjectId: bigint;
}

export default function QuestionsSection({ chapterId, subjectId }: QuestionsSectionProps) {
  const { data: questions = [], isLoading } = useGetQuestions(chapterId);
  const addQuestion = useAddQuestion();
  const deleteQuestion = useDeleteQuestion();

  const [questionText, setQuestionText] = useState('');
  const [answer, setAnswer] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const handleAdd = async () => {
    if (!questionText.trim() || !answer.trim()) return;
    await addQuestion.mutateAsync({
      chapterId,
      subjectId,
      questionText: questionText.trim(),
      answer: answer.trim(),
    });
    setQuestionText('');
    setAnswer('');
  };

  const handleDelete = async (questionId: bigint) => {
    await deleteQuestion.mutateAsync({ questionId, chapterId });
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Add question form */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <div>
          <Label htmlFor="q-text">Question</Label>
          <Input
            id="q-text"
            placeholder="Enter your question..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="mt-1 bg-white"
          />
        </div>
        <div>
          <Label htmlFor="q-answer">Answer</Label>
          <Textarea
            id="q-answer"
            placeholder="Enter the answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className="mt-1 resize-none bg-white"
          />
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={addQuestion.isPending || !questionText.trim() || !answer.trim()}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus size={14} className="mr-1" />
          {addQuestion.isPending ? 'Adding...' : 'Add Question'}
        </Button>
      </div>

      {/* Questions list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No questions yet. Add your first question above.</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q: Question) => {
            const idStr = String(q.id);
            const expanded = expandedIds.has(idStr);
            return (
              <div key={idStr} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-start gap-2 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{q.questionText}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleExpand(idStr)}
                      className="text-teal-600 hover:text-teal-800 transition-colors"
                    >
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {expanded && (
                  <div className="px-3 pb-3 border-t border-gray-100 pt-2">
                    <p className="text-xs text-gray-500 font-medium mb-1">Answer:</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.answer}</p>
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
