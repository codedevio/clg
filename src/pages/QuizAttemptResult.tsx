import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  Home,
  FileText,
} from 'lucide-react';

interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
  correct_count: number | null;
  wrong_count: number | null;
  unanswered_count: number | null;
  time_spent_seconds: number | null;
  total_marks: number | null;
  submitted_at: string | null;
  quiz: {
    title: string;
    show_results_to_students: boolean;
    total_marks: number;
    passing_percentage: number;
  };
  student_identities: {
    full_name: string;
  };
}

const QuizAttemptResult = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  const fetchAttempt = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes:quiz_id (
            title,
            show_results_to_students,
            total_marks,
            passing_percentage
          ),
          student_identities (
            full_name
          )
        `)
        .eq('id', attemptId)
        .single();

      if (error) throw error;
      
      setAttempt({
        ...data,
        quiz: data.quizzes,
        student_identities: data.student_identities,
      } as unknown as QuizAttempt);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            <Skeleton className="h-6 w-32 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-6">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Result Not Found</h2>
            <p className="text-muted-foreground mb-6">
              Unable to load quiz results. The attempt may not exist or you may not have access.
            </p>
            <Button asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show results immediately - the show_results_to_students flag only controls detailed breakdown
  const showDetailedResults = attempt.quiz?.show_results_to_students;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{attempt.quiz?.title}</CardTitle>
          <CardDescription>
            Quiz completed by {attempt.student_identities?.full_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Circle - Only shows marks, no rank/position */}
          <div className="flex flex-col items-center">
            <div className={`h-32 w-32 rounded-full flex items-center justify-center ${
              attempt.passed ? 'bg-accent/20' : 'bg-destructive/20'
            }`}>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {attempt.score ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  out of {attempt.quiz?.total_marks ?? 0}
                </p>
              </div>
            </div>
            <p className="mt-4 text-lg text-muted-foreground">
              {attempt.percentage?.toFixed(1) ?? 0}%
            </p>
          </div>

          {/* Stats */}
          {showDetailedResults && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-accent mb-1">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-2xl font-bold">{attempt.correct_count ?? 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-destructive mb-1">
                  <XCircle className="h-5 w-5" />
                  <span className="text-2xl font-bold">{attempt.wrong_count ?? 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">Wrong</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                  <MinusCircle className="h-5 w-5" />
                  <span className="text-2xl font-bold">{attempt.unanswered_count ?? 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">Unanswered</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 text-primary mb-1">
                  <Clock className="h-5 w-5" />
                  <span className="text-2xl font-bold">{formatDuration(attempt.time_spent_seconds)}</span>
                </div>
                <p className="text-sm text-muted-foreground">Time Taken</p>
              </div>
            </div>
          )}

          {!showDetailedResults && (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                Detailed results are not available for this quiz.
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizAttemptResult;
