import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';
import {
  ClipboardList,
  Trophy,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  Search,
  GraduationCap,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';

interface MyAttempt {
  id: string;
  quiz_id: string;
  status: string;
  score: number | null;
  total_marks: number | null;
  percentage: number | null;
  passed: boolean | null;
  correct_count: number | null;
  wrong_count: number | null;
  unanswered_count: number | null;
  time_spent_seconds: number | null;
  submitted_at: string | null;
  quizzes: { title: string; total_marks: number };
}

const formatDuration = (seconds: number | null) => {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const StudentMyResults = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<MyAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchMyResults();
  }, [user]);

  const fetchMyResults = async () => {
    setLoading(true);
    try {
      // Students don't have student_identity_id tied to their auth.uid —
      // they identify by roll_number/college_id. So we fetch attempts
      // that were submitted and match the profile email as respondent.
      // Since quiz attempts are public-insert (anon), we show all submitted
      // attempts where show_results_to_students = true on connected quiz.
      // The student must have gotten an attemptId from a prior quiz session
      // stored in localStorage.
      const storedAttemptIds: string[] = JSON.parse(
        localStorage.getItem('qx_my_attempts') || '[]'
      );

      if (storedAttemptIds.length === 0) {
        setAttempts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`*, quizzes(title, total_marks)`)
        .in('id', storedAttemptIds)
        .in('status', ['submitted', 'auto_submitted'])
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setAttempts((data as unknown as MyAttempt[]) || []);
    } catch (err) {
      console.error('Error fetching my results:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = attempts.filter(a =>
    a.quizzes?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAttempts = attempts.length;
  const passed = attempts.filter(a => a.passed).length;
  const avgScore = totalAttempts > 0
    ? Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / totalAttempts)
    : 0;

  return (
    <DashboardLayout>
      <SEO title="My Results | QuizoraX" description="View your personal quiz results" />
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Results</h1>
          <p className="text-muted-foreground mt-1">
            Your personal quiz attempt history and scores
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Attempts', value: totalAttempts, icon: ClipboardList, color: 'bg-primary' },
            { label: 'Passed', value: passed, icon: CheckCircle, color: 'bg-emerald-500' },
            { label: 'Avg. Score', value: `${avgScore}%`, icon: TrendingUp, color: 'bg-amber-500' },
          ].map(stat => (
            <Card key={stat.label} className="border-border/50 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{loading ? '…' : stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Results Table */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Quiz History
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {totalAttempts} submitted attempt{totalAttempts !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quiz…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <GraduationCap className="h-12 w-12 mb-4 opacity-30" />
                {totalAttempts === 0 ? (
                  <>
                    <p className="font-medium">No attempts yet</p>
                    <p className="text-sm mt-1">
                      Your quiz results will appear here after you complete a quiz.
                    </p>
                  </>
                ) : (
                  <p>No quizzes match your search.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Quiz</th>
                      <th className="pb-3 pr-4 font-medium text-center">Score</th>
                      <th className="pb-3 pr-4 font-medium text-center">%</th>
                      <th className="pb-3 pr-4 font-medium text-center">✓ / ✗ / –</th>
                      <th className="pb-3 pr-4 font-medium text-center">Duration</th>
                      <th className="pb-3 pr-4 font-medium text-center">Result</th>
                      <th className="pb-3 font-medium text-center">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filtered.map(a => (
                      <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-medium text-foreground">
                          {a.quizzes?.title || 'Unknown Quiz'}
                        </td>
                        <td className="py-3 pr-4 text-center font-mono text-sm">
                          {a.score ?? 0}/{a.total_marks ?? a.quizzes?.total_marks ?? '?'}
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <span className={`font-semibold text-sm ${
                            (a.percentage || 0) >= 60 ? 'text-emerald-500'
                            : (a.percentage || 0) >= 40 ? 'text-amber-500'
                            : 'text-red-500'
                          }`}>
                            {a.percentage?.toFixed(1) ?? 0}%
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <span className="flex items-center justify-center gap-2 text-xs">
                            <span className="flex items-center gap-0.5 text-emerald-500">
                              <CheckCircle className="h-3 w-3" />{a.correct_count ?? 0}
                            </span>
                            <span className="flex items-center gap-0.5 text-red-500">
                              <XCircle className="h-3 w-3" />{a.wrong_count ?? 0}
                            </span>
                            <span className="flex items-center gap-0.5 text-muted-foreground">
                              <MinusCircle className="h-3 w-3" />{a.unanswered_count ?? 0}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center text-muted-foreground">
                          <span className="flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(a.time_spent_seconds)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <Badge variant={a.passed ? 'default' : 'destructive'} className="text-xs">
                            {a.passed ? '✅ Passed' : '❌ Failed'}
                          </Badge>
                        </td>
                        <td className="py-3 text-center text-xs text-muted-foreground">
                          {a.submitted_at
                            ? format(new Date(a.submitted_at), 'dd MMM yy, hh:mm a')
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

        {/* Note about how results are stored */}
        <p className="text-xs text-muted-foreground text-center pb-4">
          Results are stored locally on this device. Clearing browser data will remove this history.
        </p>
      </div>
    </DashboardLayout>
  );
};

export default StudentMyResults;
