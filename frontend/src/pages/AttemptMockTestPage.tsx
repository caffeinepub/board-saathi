import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetMockTest, useSubmitMockTest } from '../hooks/useQueries';
import type { MCQAnswer } from '../backend';

export default function AttemptMockTestPage() {
  const { testId } = useParams({ from: '/layout/mock-tests/$testId/attempt' });
  const navigate = useNavigate();
  const testIdBig = BigInt(testId);

  const { data: test, isLoading } = useGetMockTest(testIdBig);
  const submitMockTest = useSubmitMockTest();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [elapsed, setElapsed] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Test not found.</p>
        <Button onClick={() => navigate({ to: '/mock-tests' })} className="mt-4">Back to Tests</Button>
      </div>
    );
  }

  const questions = test.questions;
  const currentQuestion = questions[currentIdx];

  const handleSelectOption = (questionId: bigint, optionIdx: number) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: optionIdx }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const mcqAnswers: MCQAnswer[] = questions.map((q) => ({
      questionId: q.id,
      selectedOption: BigInt(answers[String(q.id)] ?? 999),
    }));
    await submitMockTest.mutateAsync({
      testId: testIdBig,
      answers: mcqAnswers,
      timeTaken: BigInt(elapsed),
    });
    navigate({ to: '/mock-tests/$testId/report', params: { testId } });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{test.name}</h1>
          <p className="text-xs text-gray-400">{answeredCount}/{questions.length} answered</p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-1.5">
          <Clock size={14} className="text-orange-500" />
          <span className="text-sm font-mono font-semibold text-orange-700">{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
            Q{currentIdx + 1} of {questions.length}
          </span>
        </div>
        <p className="text-base font-medium text-gray-800 mb-4">{currentQuestion.questionText}</p>
        <div className="space-y-2">
          {currentQuestion.options.map((option, idx) => {
            const selected = answers[String(currentQuestion.id)] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(currentQuestion.id, idx)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  selected
                    ? 'bg-teal-50 border-teal-400 text-teal-800 font-medium'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50/50'
                }`}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span>
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >
          <ChevronLeft size={16} className="mr-1" />
          Previous
        </Button>
        {currentIdx < questions.length - 1 ? (
          <Button
            size="sm"
            onClick={() => setCurrentIdx((i) => i + 1)}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            Next
            <ChevronRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitMockTest.isPending || submitted}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle size={16} className="mr-1" />
            {submitMockTest.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        )}
      </div>

      {/* Question navigator */}
      <div className="bg-white border border-gray-100 rounded-xl p-3">
        <p className="text-xs text-gray-400 mb-2">Question Navigator</p>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, idx) => {
            const answered = answers[String(q.id)] !== undefined;
            return (
              <button
                key={String(q.id)}
                onClick={() => setCurrentIdx(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  idx === currentIdx
                    ? 'bg-teal-600 text-white'
                    : answered
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
