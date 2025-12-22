import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Users,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  MinusCircle,
  Download,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';

interface QuizAttempt {
  id: string;
  student_identity_id: string;
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
  status: string;
  started_at: string;
  submitted_at: string | null;
  time_spent_seconds: number | null;
  correct_count: number | null;
  wrong_count: number | null;
  unanswered_count: number | null;
  tab_switch_count: number | null;
  student_identities: {
    full_name: string;
    roll_number: string;
    batch: string;
    college_id: string;
  };
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  total_marks: number;
  time_limit_minutes: number;
  is_published: boolean;
}

const QuizResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuizResults();
  }, [quizId]);

  const fetchQuizResults = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      const { data: attemptsData, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          student_identities (
            full_name,
            roll_number,
            batch,
            college_id
          )
        `)
        .eq('quiz_id', quizId)
        .order('submitted_at', { ascending: false });

      if (attemptsError) throw attemptsError;
      setAttempts(attemptsData as QuizAttempt[]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading results',
        description: error.message,
      });
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

  const getStats = () => {
    const submitted = attempts.filter(a => a.status === 'submitted' || a.status === 'auto_submitted');
    const scores = submitted.map(a => a.percentage || 0);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const passCount = submitted.filter(a => a.passed).length;
    const passRate = submitted.length > 0 ? (passCount / submitted.length) * 100 : 0;
    
    return {
      totalAttempts: attempts.length,
      submitted: submitted.length,
      avgScore: avgScore.toFixed(1),
      passRate: passRate.toFixed(1),
    };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">Quiz not found</h2>
          <Button asChild className="mt-4">
            <Link to="/dashboard/quizzes">Back to Quizzes</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/quizzes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
              <p className="text-muted-foreground">Quiz Results & Analytics</p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                  <p className="text-sm text-muted-foreground">Total Attempts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.submitted}</p>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgScore}%</p>
                  <p className="text-sm text-muted-foreground">Avg. Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.passRate}%</p>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attempts Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Student Attempts</CardTitle>
            <CardDescription>All quiz attempts by students</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No attempts yet. Share your quiz link to get responses.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Roll No.</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Batch</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Score</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Result</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Duration</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tab Switches</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => (
                      <tr key={attempt.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">
                          {attempt.student_identities?.full_name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {attempt.student_identities?.roll_number || '-'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {attempt.student_identities?.batch || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{attempt.score ?? '-'}/{quiz.total_marks}</span>
                            <span className="text-muted-foreground text-sm">
                              ({attempt.percentage?.toFixed(1) ?? 0}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="text-accent flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> {attempt.correct_count ?? 0}
                            </span>
                            <span className="text-destructive flex items-center gap-1">
                              <XCircle className="h-3 w-3" /> {attempt.wrong_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MinusCircle className="h-3 w-3" /> {attempt.unanswered_count ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {attempt.passed !== null && (
                            <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                              {attempt.passed ? 'Passed' : 'Failed'}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDuration(attempt.time_spent_seconds)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={(attempt.tab_switch_count ?? 0) > 2 ? 'destructive' : 'secondary'}>
                            {attempt.tab_switch_count ?? 0}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            attempt.status === 'submitted' ? 'default' :
                            attempt.status === 'auto_submitted' ? 'secondary' :
                            attempt.status === 'in_progress' ? 'outline' : 'destructive'
                          }>
                            {attempt.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {attempt.submitted_at 
                            ? format(new Date(attempt.submitted_at), 'MMM d, yyyy h:mm a')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default QuizResults;
