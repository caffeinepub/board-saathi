import { useParams, useNavigate } from '@tanstack/react-router';
import { CheckCircle2, XCircle, ArrowLeft, Trophy, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGetTestAttemptsForTest } from '../hooks/useQueries';

export default function TestReportPage() {
  const { testId: testIdStr } = useParams({ from: '/layout/mock-tests/$testId/report' });
  const navigate = useNavigate();
  const testIdNum = parseInt(testIdStr, 10);

  const { data: attempts = [], isLoading } = useGetTestAttemptsForTest(testIdNum);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 p-6">
        <p className="text-muted-foreground">No attempts found for this test.</p>
        <Button onClick={() => navigate({ to: '/mock-tests' })}>Back to Tests</Button>
      </div>
    );
  }

  // Show the latest attempt
  const attempt = attempts[attempts.length - 1];
  const report = attempt.report;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getScoreColor = (pct: number) => {
    if (pct >= 80) return 'text-green-600';
    if (pct >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/mock-tests' })}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{report.testName}</h1>
          <p className="text-sm text-muted-foreground">
            Attempt #{attempts.length} · {new Date(attempt.attemptedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Score Summary */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <p className={`text-4xl font-bold ${getScoreColor(report.percentage)}`}>
                {report.percentage}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {report.score}/{report.total} correct
              </p>
            </div>
            <Trophy className={`w-12 h-12 ${getScoreColor(report.percentage)}`} />
          </div>
          <Progress value={report.percentage} className="h-3 mb-3" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Score: {report.score}/{report.total}</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(report.timeTaken)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All attempts summary */}
      {attempts.length > 1 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">All Attempts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {attempts.map((a, idx) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Attempt #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${getScoreColor(a.report.percentage)}`}>
                      {a.report.percentage}%
                    </span>
                    <span className="text-muted-foreground text-xs">{formatTime(a.report.timeTaken)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Question Breakdown</h2>
        <div className="space-y-3">
          {report.results.map((result, idx) => (
            <Card key={result.questionId} className={result.isCorrect ? 'border-green-200' : 'border-red-200'}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {result.isCorrect
                    ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-2">Q{idx + 1}. {result.questionText}</p>
                    <div className="space-y-1 text-xs">
                      {result.selectedOption !== 999 && (
                        <p className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                          Your answer: Option {String.fromCharCode(65 + result.selectedOption)}
                        </p>
                      )}
                      {result.selectedOption === 999 && (
                        <p className="text-muted-foreground">Not answered</p>
                      )}
                      {!result.isCorrect && (
                        <p className="text-green-600">
                          Correct: Option {String.fromCharCode(65 + result.correctOption)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={result.isCorrect ? 'default' : 'destructive'} className="text-xs flex-shrink-0">
                    {result.isCorrect ? '+1' : '0'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => navigate({ to: '/mock-tests/$testId/attempt', params: { testId: testIdStr } })}
        >
          Retry Test
        </Button>
        <Button className="flex-1" onClick={() => navigate({ to: '/mock-tests' })}>
          Back to Tests
        </Button>
      </div>
    </div>
  );
}
