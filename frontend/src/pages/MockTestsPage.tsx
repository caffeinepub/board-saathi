import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Play, Trash2, BarChart2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetMockTests, useGetSubjects, useGetTestAttempts, useDeleteMockTest } from '../hooks/useQueries';
import type { MockTest, TestAttempt } from '../backend';

export default function MockTestsPage() {
  const navigate = useNavigate();
  const { data: tests = [], isLoading } = useGetMockTests();
  const { data: subjects = [] } = useGetSubjects();
  const { data: attempts = [] } = useGetTestAttempts();
  const deleteMockTest = useDeleteMockTest();

  const getSubjectName = (subjectId: bigint): string => {
    return subjects.find((s) => s.id === subjectId)?.name ?? 'Unknown';
  };

  const getAttemptsForTest = (testId: bigint): TestAttempt[] => {
    return attempts.filter((a) => a.testId === testId);
  };

  const getBestScore = (testId: bigint): number => {
    const testAttempts = getAttemptsForTest(testId);
    if (testAttempts.length === 0) return 0;
    return Math.max(...testAttempts.map((a) => Number(a.report.percentage)));
  };

  const handleViewReport = (testId: bigint) => {
    navigate({ to: '/mock-tests/$testId/report', params: { testId: String(testId) } });
  };

  const handleDelete = async (testId: bigint) => {
    await deleteMockTest.mutateAsync(testId);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mock Tests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Practice with custom MCQ tests</p>
        </div>
        <Button
          onClick={() => navigate({ to: '/mock-tests/create' })}
          className="bg-teal-600 hover:bg-teal-700 text-white"
          size="sm"
        >
          <Plus size={14} className="mr-1" />
          Create Test
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} className="text-teal-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No mock tests yet</h3>
          <p className="text-sm text-gray-400">Create your first mock test to start practicing.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test: MockTest) => {
            const testAttempts = getAttemptsForTest(test.id);
            const bestScore = getBestScore(test.id);
            return (
              <div
                key={String(test.id)}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-800">{test.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {getSubjectName(test.subjectId)} · {test.questions.length} questions
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {testAttempts.length > 0 && (
                      <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                        Best: {bestScore}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => navigate({ to: '/mock-tests/$testId/attempt', params: { testId: String(test.id) } })}
                    className="bg-teal-600 hover:bg-teal-700 text-white flex-1"
                  >
                    <Play size={14} className="mr-1" />
                    {testAttempts.length > 0 ? 'Retry' : 'Start'}
                  </Button>
                  {testAttempts.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewReport(test.id)}
                      className="border-teal-200 text-teal-700 hover:bg-teal-50"
                    >
                      <BarChart2 size={14} className="mr-1" />
                      Report
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(test.id)}
                    className="border-red-200 text-red-500 hover:bg-red-50"
                    disabled={deleteMockTest.isPending}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                {testAttempts.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    {testAttempts.length} attempt{testAttempts.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
