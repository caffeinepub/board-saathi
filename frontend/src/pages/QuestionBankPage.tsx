import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useGetSubjects, useGetAllChapters, useGetQuestionBank, LocalQuestion } from '../hooks/useQueries';

function QuestionCard({ question }: { question: LocalQuestion }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium mb-2">{question.questionText}</p>
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {showAnswer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showAnswer ? 'Hide Answer' : 'Show Answer'}
        </button>
        {showAnswer && (
          <div className="mt-2 bg-muted/50 rounded-md p-2">
            <p className="text-sm text-muted-foreground">{question.answer}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function QuestionBankPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>(undefined);
  const [selectedChapterId, setSelectedChapterId] = useState<number | undefined>(undefined);

  const { data: subjects = [] } = useGetSubjects();
  const { data: allChapters = [] } = useGetAllChapters();
  const { data: questions = [], isLoading } = useGetQuestionBank(selectedSubjectId, selectedChapterId);

  const chaptersForSubject = selectedSubjectId
    ? allChapters.filter(c => c.subjectId === selectedSubjectId)
    : [];

  const handleSubjectChange = (val: string) => {
    if (val === 'all') {
      setSelectedSubjectId(undefined);
    } else {
      setSelectedSubjectId(parseInt(val, 10));
    }
    setSelectedChapterId(undefined);
  };

  const handleChapterChange = (val: string) => {
    if (val === 'all') {
      setSelectedChapterId(undefined);
    } else {
      setSelectedChapterId(parseInt(val, 10));
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <p className="text-muted-foreground text-sm mt-1">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Select
          value={selectedSubjectId?.toString() ?? 'all'}
          onValueChange={handleSubjectChange}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedChapterId?.toString() ?? 'all'}
          onValueChange={handleChapterChange}
          disabled={!selectedSubjectId}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Chapters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chapters</SelectItem>
            {chaptersForSubject.map(c => (
              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-16">
          <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No questions found</h3>
          <p className="text-muted-foreground text-sm">
            Add questions inside chapters to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
