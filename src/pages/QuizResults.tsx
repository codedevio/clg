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
  Printer,
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
  passing_percentage: number;
  first_position_min: number;
  second_position_min: number;
  third_position_min: number;
}

const QuizResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePrintClass = () => {
    window.print();
  };
  
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
        .in('status', ['submitted', 'auto_submitted'])
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

  // Sort attempts by score (desc), then by time taken (asc) as tie-breaker
  const getSortedAttempts = () => {
    return [...attempts].sort((a, b) => {
      // First: Compare by score (descending)
      const scoreA = a.score ?? 0;
      const scoreB = b.score ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      
      // Tie-breaker: Shorter completion duration wins (faster student ranks higher)
      const durationA = a.time_spent_seconds ?? Infinity;
      const durationB = b.time_spent_seconds ?? Infinity;
      return durationA - durationB;
    });
  };

  const getRank = (attemptId: string) => {
    const sorted = getSortedAttempts();
    const index = sorted.findIndex(a => a.id === attemptId);
    return index + 1;
  };

  const getPositionByRank = (rank: number, percentage: number | null) => {
    if (!quiz) return { label: '-', variant: 'secondary' as const, icon: null };
    
    // Check if passed first
    const passed = percentage !== null && percentage >= quiz.passing_percentage;
    
    if (rank === 1 && passed) {
      return { label: '1st Position', variant: 'default' as const, icon: '🥇' };
    } else if (rank === 2 && passed) {
      return { label: '2nd Position', variant: 'default' as const, icon: '🥈' };
    } else if (rank === 3 && passed) {
      return { label: '3rd Position', variant: 'default' as const, icon: '🥉' };
    } else if (passed) {
      return { label: 'Passed', variant: 'secondary' as const, icon: '✅' };
    } else {
      return { label: 'Failed', variant: 'destructive' as const, icon: '❌' };
    }
  };

  const getStats = () => {
    const submitted = attempts.filter(a => a.status === 'submitted' || a.status === 'auto_submitted');
    const scores = submitted.map(a => a.percentage || 0);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const passCount = submitted.filter(a => a.passed === true).length;
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

  const passCount = attempts.filter(a => a.passed === true).length;
  const failCount = attempts.filter(a => a.passed === false).length;
  const generatedAt = format(new Date(), 'dd MMM yyyy, hh:mm a');

  return (
    <DashboardLayout>
      {/* ── Print-only styles ────────────────────────────────────── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #quiz-class-report, #quiz-class-report * { visibility: visible !important; }
          #quiz-class-report {
            position: absolute; left: 0; top: 0;
            width: 100%; padding: 24px; font-family: Arial, sans-serif;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── Print-only marksheet (hidden on screen) ──────────────── */}
      <div id="quiz-class-report" style={{ display: 'none' }}>
        <style>{`
          #quiz-class-report { display: block !important; }
          @media screen { #quiz-class-report { display: none !important; } }
          @media print  { #quiz-class-report { display: block !important; } }
        `}</style>

        {/* College-style header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: 12, marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Quiz Result Sheet</h1>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '4px 0 0' }}>{quiz.title}</h2>
          {quiz.description && <p style={{ fontSize: 12, color: '#555', margin: '2px 0 0' }}>{quiz.description}</p>}
        </div>

        {/* Meta info row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12, color: '#444' }}>
          <span>Total Marks: <b>{quiz.total_marks}</b></span>
          <span>Time Limit: <b>{quiz.time_limit_minutes} mins</b></span>
          <span>Passing: <b>{quiz.passing_percentage}%</b></span>
          <span>Total Students: <b>{attempts.length}</b></span>
          <span>Pass: <b style={{ color: 'green' }}>{passCount}</b> &nbsp;|&nbsp; Fail: <b style={{ color: 'red' }}>{failCount}</b></span>
        </div>

        {/* Ranked table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              {['Rank', 'Name', 'Roll No.', 'Batch', 'College ID', 'Score', '%', 'Correct', 'Wrong', 'Unanswered', 'Duration', 'Result', 'Submitted At'].map(h => (
                <th key={h} style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getSortedAttempts().map((attempt, idx) => {
              const rank = idx + 1;
              const passed = attempt.passed;
              return (
                <tr key={attempt.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontWeight: 700 }}>#{rank}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}>{attempt.student_identities?.full_name || '-'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}>{attempt.student_identities?.roll_number || '-'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}>{attempt.student_identities?.batch || '-'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}>{attempt.student_identities?.college_id || '-'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontWeight: 600 }}>{attempt.score ?? 0}/{quiz.total_marks}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontWeight: 600 }}>{attempt.percentage?.toFixed(1) ?? 0}%</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', color: 'green' }}>{attempt.correct_count ?? 0}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', color: 'red' }}>{attempt.wrong_count ?? 0}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}>{attempt.unanswered_count ?? 0}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px' }}>{attempt.time_spent_seconds ? `${Math.floor(attempt.time_spent_seconds / 60)}m ${attempt.time_spent_seconds % 60}s` : '-'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontWeight: 700, color: passed ? 'green' : 'red' }}>
                    {rank === 1 && passed ? '🥇 1st' : rank === 2 && passed ? '🥈 2nd' : rank === 3 && passed ? '🥉 3rd' : passed ? 'Pass' : 'Fail'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '5px 8px', fontSize: 11 }}>
                    {attempt.submitted_at ? format(new Date(attempt.submitted_at), 'dd/MM/yy hh:mm a') : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Stats footer */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid #ccc', paddingTop: 10, color: '#444' }}>
          <span>Avg. Score: <b>{stats.avgScore}%</b></span>
          <span>Pass Rate: <b>{stats.passRate}%</b></span>
          <span>Generated: <b>{generatedAt}</b></span>
          <span style={{ fontStyle: 'italic', color: '#888' }}>QuizoraX &mdash; Confidential</span>
        </div>
      </div>

      {/* ── Regular on-screen view ───────────────────────────────── */}
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/quizzes')} className="no-print">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
              <p className="text-muted-foreground">Quiz Results & Analytics</p>
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={handlePrintClass} disabled={attempts.length === 0}>
              <Printer className="h-4 w-4 mr-2" />
              Print Class Report
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
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
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rank</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Roll No.</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Batch</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Score</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Result</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Duration</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tab Switches</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Submitted</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedAttempts().map((attempt) => {
                      const rank = getRank(attempt.id);
                      return (
                        <tr key={attempt.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-3 px-4 font-bold text-lg">
                            #{rank}
                          </td>
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
                            {(() => {
                              const position = getPositionByRank(rank, attempt.percentage);
                              return (
                                <Badge variant={position.variant}>
                                  {position.icon} {position.label}
                                </Badge>
                              );
                            })()}
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
                          <td className="py-3 px-4">
                            {(attempt.status === 'submitted' || attempt.status === 'auto_submitted') && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate(`/dashboard/quizzes/attempt/${attempt.id}/review`)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
