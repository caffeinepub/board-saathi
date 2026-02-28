import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Play, Trash2, FileText, Loader2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  useGetMockTests,
  useDeleteMockTest,
  useGetSubjects,
  useGetTestAttempts,
} from '../hooks/useQueries';

export default function MockTestsPage() {
  const navigate = useNavigate();
  const { data: tests = [], isLoading } = useGetMockTests();
  const { data: subjects = [] } = useGetSubjects();
  const { data: attempts = [] } = useGetTestAttempts();
  const deleteMockTest = useDeleteMockTest();

  const getSubjectName = (subjectId: number) => {
    return subjects.find(s => s.id === subjectId)?.name ?? 'Unknown';
  };

  const getAttemptsForTest = (testId: number) => {
    return attempts.filter(a => a.testId === testId);
  };

  const getBestScore = (testId: number) => {
    const testAttempts = getAttemptsForTest(testId);
    if (testAttempts.length === 0) return null;
    return Math.max(...testAttempts.map(a => a.report.percentage));
  };

  const handleDelete = async (testId: number) => {
    try {
      await deleteMockTest.mutateAsync(testId);
      toast.success('Test deleted');
    } catch {
      toast.error('Failed to delete test');
    }
  };

  const handleViewReport = (testId: number) => {
    navigate({ to: '/mock-tests/$testId/report', params: { testId: testId.toString() } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mock Tests</h1>
          <p className="text-muted-foreground text-sm mt-1">{tests.length} test{tests.length !== 1 ? 's' : ''} created</p>
        </div>
        <Button onClick={() => navigate({ to: '/mock-tests/create' })} className="gap-2">
          <Plus className="w-4 h-4" />Create Test
        </Button>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No mock tests yet</h3>
          <p className="text-muted-foreground mb-4">Create your first mock test to practice</p>
          <Button onClick={() => navigate({ to: '/mock-tests/create' })} className="gap-2">
            <Plus className="w-4 h-4" />Create Test
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map(test => {
            const testAttempts = getAttemptsForTest(test.id);
            const bestScore = getBestScore(test.id);
            return (
              <Card key={test.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{test.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {getSubjectName(test.subjectId)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {test.questions.length} question{test.questions.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {testAttempts.length} attempt{testAttempts.length !== 1 ? 's' : ''}
                        </span>
                        {bestScore !== null && (
                          <Badge variant="outline" className="text-xs">
                            Best: {bestScore}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {testAttempts.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(test.id)}
                          className="gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />Report
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => navigate({ to: '/mock-tests/$testId/attempt', params: { testId: test.id.toString() } })}
                        className="gap-1"
                      >
                        <Play className="w-3.5 h-3.5" />Attempt
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(test.id)}
                        disabled={deleteMockTest.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
