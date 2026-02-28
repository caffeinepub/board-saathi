import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGetSubjects, useCreateMockTest } from '../hooks/useQueries';
import type { MCQQuestion } from '../backend';

interface LocalQuestion {
  id: number;
  questionText: string;
  options: string[];
  correctOption: number;
}

export default function CreateMockTestPage() {
  const navigate = useNavigate();
  const { data: subjects = [] } = useGetSubjects();
  const createMockTest = useCreateMockTest();

  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [questions, setQuestions] = useState<LocalQuestion[]>([
    { id: 1, questionText: '', options: ['', '', '', ''], correctOption: 0 },
  ]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { id: prev.length + 1, questionText: '', options: ['', '', '', ''], correctOption: 0 },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: keyof LocalQuestion, value: string | number | string[]) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOptions = [...q.options];
        newOptions[oIdx] = value;
        return { ...q, options: newOptions };
      })
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !subjectId) return;
    const mcqQuestions: MCQQuestion[] = questions.map((q, idx) => ({
      id: BigInt(idx + 1),
      questionText: q.questionText,
      options: q.options,
      correctOption: BigInt(q.correctOption),
    }));
    await createMockTest.mutateAsync({
      name: name.trim(),
      subjectId: BigInt(subjectId),
      questions: mcqQuestions,
    });
    navigate({ to: '/mock-tests' });
  };

  const isValid =
    name.trim() &&
    subjectId &&
    questions.length > 0 &&
    questions.every((q) => q.questionText.trim() && q.options.every((o) => o.trim()));

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate({ to: '/mock-tests' })}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Create Mock Test</h1>
      </div>

      <div className="space-y-6">
        {/* Test details */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div>
            <Label htmlFor="test-name">Test Name *</Label>
            <Input
              id="test-name"
              placeholder="e.g., Chapter 1 Practice Test"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Subject *</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select subject..." />
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
        </div>

        {/* Questions */}
        {questions.map((q, qIdx) => (
          <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Question {qIdx + 1}</span>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qIdx)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <Input
              placeholder="Enter question text..."
              value={q.questionText}
              onChange={(e) => updateQuestion(qIdx, 'questionText', e.target.value)}
            />
            <div className="space-y-2">
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIdx}`}
                    checked={q.correctOption === oIdx}
                    onChange={() => updateQuestion(qIdx, 'correctOption', oIdx)}
                    className="text-teal-600"
                  />
                  <Input
                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                    value={opt}
                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">Select the radio button next to the correct answer</p>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addQuestion}
          className="w-full border-dashed border-teal-300 text-teal-600 hover:bg-teal-50"
        >
          <Plus size={16} className="mr-2" />
          Add Question
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || createMockTest.isPending}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          {createMockTest.isPending ? 'Creating...' : 'Create Test'}
        </Button>
      </div>
    </div>
  );
}
