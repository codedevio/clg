import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  Download,
  Users,
  FileText,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  RefreshCw,
  Calendar,
  Award,
  BookOpen,
} from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

interface ReportData {
  // Overview
  totalUsers: number;
  totalAdmins: number;
  totalStudents: number;
  totalQuizzes: number;
  totalSurveys: number;
  totalAttempts: number;
  totalSurveyResponses: number;
  totalQuestions: number;

  // Performance
  overallPassCount: number;
  overallFailCount: number;
  overallAvgScore: number;
  overallAvgDuration: number;

  // Role distribution
  roleDistribution: { name: string; value: number }[];

  // Daily activity last 14 days
  dailyActivity: { date: string; attempts: number; responses: number }[];

  // Top quizzes by attempts
  topQuizzes: { title: string; attempts: number; avgScore: number; passRate: number }[];

  // Score distribution across all quizzes
  scoreDistribution: { range: string; count: number }[];

  // Difficulty breakdown
  difficultyBreakdown: { difficulty: string; count: number }[];

  generatedAt: string;
}

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'];

const AdminReport = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // ── 1. Users & Roles ──────────────────────────────────────────────
      const { data: profiles } = await supabase.from('profiles').select('id, created_at');
      const { data: roles } = await supabase.from('user_roles').select('user_id, role');

      const totalUsers = profiles?.length || 0;
      const adminIds = new Set((roles || []).filter(r => r.role === 'admin' || r.role === 'super_admin').map(r => r.user_id));
      const studentIds = new Set((roles || []).filter(r => r.role === 'student').map(r => r.user_id));
      const totalAdmins = adminIds.size;
      const totalStudents = studentIds.size;

      const roleDistribution = [
        { name: 'Super Admin', value: (roles || []).filter(r => r.role === 'super_admin').length },
        { name: 'Admin', value: (roles || []).filter(r => r.role === 'admin').length },
        { name: 'Student', value: (roles || []).filter(r => r.role === 'student').length },
        { name: 'No Role', value: totalUsers - (roles?.map(r => r.user_id) ? new Set(roles.map(r => r.user_id)).size : 0) },
      ].filter(d => d.value > 0);

      // ── 2. Content counts ────────────────────────────────────────────
      const [quizRes, surveyRes, questionRes] = await Promise.all([
        supabase.from('quizzes').select('id, title', { count: 'exact' }),
        supabase.from('surveys').select('id', { count: 'exact' }),
        supabase.from('quiz_questions').select('id, difficulty', { count: 'exact' }),
      ]);

      const totalQuizzes = quizRes.count || 0;
      const totalSurveys = surveyRes.count || 0;
      const totalQuestions = questionRes.count || 0;

      // Difficulty breakdown
      const diffMap: Record<string, number> = {};
      (questionRes.data || []).forEach(q => {
        diffMap[q.difficulty] = (diffMap[q.difficulty] || 0) + 1;
      });
      const difficultyBreakdown = Object.entries(diffMap).map(([difficulty, count]) => ({
        difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        count,
      }));

      // ── 3. Quiz Attempts ─────────────────────────────────────────────
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('id, quiz_id, status, percentage, passed, time_spent_seconds, submitted_at, created_at')
        .in('status', ['submitted', 'auto_submitted']);

      const totalAttempts = attempts?.length || 0;
      const passedAttempts = (attempts || []).filter(a => a.passed === true);
      const failedAttempts = (attempts || []).filter(a => a.passed === false);
      const overallPassCount = passedAttempts.length;
      const overallFailCount = failedAttempts.length;
      const overallAvgScore = totalAttempts > 0
        ? Math.round((attempts || []).reduce((s, a) => s + (a.percentage || 0), 0) / totalAttempts)
        : 0;
      const overallAvgDuration = totalAttempts > 0
        ? Math.round((attempts || []).reduce((s, a) => s + (a.time_spent_seconds || 0), 0) / totalAttempts / 60)
        : 0;

      // Score distribution
      const scoreRanges = [
        { range: '0–20%', min: 0, max: 20 },
        { range: '21–40%', min: 21, max: 40 },
        { range: '41–60%', min: 41, max: 60 },
        { range: '61–80%', min: 61, max: 80 },
        { range: '81–100%', min: 81, max: 100 },
      ];
      const scoreDistribution = scoreRanges.map(r => ({
        range: r.range,
        count: (attempts || []).filter(a => (a.percentage || 0) >= r.min && (a.percentage || 0) <= r.max).length,
      }));

      // ── 4. Survey Responses ──────────────────────────────────────────
      const { data: surveyResponses } = await supabase
        .from('survey_responses')
        .select('id, survey_id, created_at');
      const totalSurveyResponses = surveyResponses?.length || 0;

      // ── 5. Daily Activity (last 14 days) ─────────────────────────────
      const last14 = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
      const dailyActivity = last14.map(day => {
        const start = startOfDay(day);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const attCount = (attempts || []).filter(a => {
          const d = new Date(a.submitted_at || a.created_at);
          return d >= start && d < end;
        }).length;

        const resCount = (surveyResponses || []).filter(r => {
          const d = new Date(r.created_at);
          return d >= start && d < end;
        }).length;

        return { date: format(day, 'MMM dd'), attempts: attCount, responses: resCount };
      });

      // ── 6. Top Quizzes ───────────────────────────────────────────────
      const quizMap: Record<string, { title: string; attempts: any[] }> = {};
      (quizRes.data || []).forEach(q => { quizMap[q.id] = { title: q.title, attempts: [] }; });
      (attempts || []).forEach(a => { if (quizMap[a.quiz_id]) quizMap[a.quiz_id].attempts.push(a); });

      const topQuizzes = Object.values(quizMap)
        .map(q => {
          const att = q.attempts;
          const avg = att.length > 0 ? Math.round(att.reduce((s: number, a: any) => s + (a.percentage || 0), 0) / att.length) : 0;
          const passRate = att.length > 0 ? Math.round((att.filter((a: any) => a.passed).length / att.length) * 100) : 0;
          return { title: q.title.length > 20 ? q.title.substring(0, 20) + '…' : q.title, attempts: att.length, avgScore: avg, passRate };
        })
        .sort((a, b) => b.attempts - a.attempts)
        .slice(0, 6);

      setData({
        totalUsers, totalAdmins, totalStudents, totalQuizzes, totalSurveys,
        totalAttempts, totalSurveyResponses, totalQuestions,
        overallPassCount, overallFailCount, overallAvgScore, overallAvgDuration,
        roleDistribution, dailyActivity, topQuizzes, scoreDistribution, difficultyBreakdown,
        generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      });
    } catch (err) {
      console.error('Report fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    setGenerating(true);
    // Small delay so button state renders before print dialog opens
    setTimeout(() => {
      window.print();
      setGenerating(false);
    }, 300);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-60" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) return null;

  const passRate = data.totalAttempts > 0
    ? Math.round((data.overallPassCount / data.totalAttempts) * 100)
    : 0;

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #admin-report-printable, #admin-report-printable * { visibility: visible !important; }
          #admin-report-printable { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
          .recharts-wrapper { page-break-inside: avoid; }
        }
      `}</style>

      <div id="admin-report-printable" ref={reportRef} className="space-y-6">

        {/* ── Report Header ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Overall System Report</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Generated: {data.generatedAt}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <Button variant="outline" size="sm" onClick={fetchReportData} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" onClick={handleDownloadPDF} disabled={generating} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0">
              <Download className="h-4 w-4" />
              {generating ? 'Preparing…' : 'Download PDF'}
            </Button>
          </div>
        </div>

        {/* ── Section 1: Platform Overview ───────────────────────────── */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Platform Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Users', value: data.totalUsers, icon: Users, color: 'from-blue-500 to-blue-600', sub: `${data.totalAdmins} admins · ${data.totalStudents} students` },
              { label: 'Total Quizzes', value: data.totalQuizzes, icon: FileText, color: 'from-indigo-500 to-indigo-600', sub: `${data.totalQuestions} questions total` },
              { label: 'Total Surveys', value: data.totalSurveys, icon: ClipboardList, color: 'from-amber-500 to-orange-500', sub: `${data.totalSurveyResponses} responses` },
              { label: 'Quiz Attempts', value: data.totalAttempts, icon: GraduationCap, color: 'from-emerald-500 to-teal-500', sub: `${passRate}% pass rate` },
            ].map(stat => (
              <Card key={stat.label} className="border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm font-medium text-foreground/80">{stat.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Section 2: Performance Summary ─────────────────────────── */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Performance Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Avg. Score', value: `${data.overallAvgScore}%`, icon: Award, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
              { label: 'Passed', value: data.overallPassCount, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
              { label: 'Failed', value: data.overallFailCount, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
              { label: 'Avg. Duration', value: `${data.overallAvgDuration}m`, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            ].map(stat => (
              <Card key={stat.label} className="border-border/50 shadow-sm">
                <CardContent className={`p-4 flex items-center gap-3`}>
                  <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Section 3: Charts Row ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* User Role Distribution - Pie */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" /> User Role Distribution
              </CardTitle>
              <CardDescription className="text-xs">{data.totalUsers} registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.roleDistribution}
                    cx="50%" cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.roleDistribution.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Score Distribution - Bar */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" /> Score Distribution
              </CardTitle>
              <CardDescription className="text-xs">All quiz attempts grouped by score range</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Students" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Section 4: Daily Activity ───────────────────────────────── */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" /> Daily Activity — Last 14 Days
            </CardTitle>
            <CardDescription className="text-xs">Quiz attempts and survey responses per day</CardDescription>
          </CardHeader>
          <CardContent>
            {data.dailyActivity.some(d => d.attempts > 0 || d.responses > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="attempts" name="Quiz Attempts" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="responses" name="Survey Responses" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No activity in the last 14 days</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Section 5: Question Difficulty Breakdown ────────────────── */}
        {data.difficultyBreakdown.length > 0 && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-500" /> Question Difficulty Breakdown
              </CardTitle>
              <CardDescription className="text-xs">{data.totalQuestions} total questions across all quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.difficultyBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="difficulty" type="category" width={60} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Questions" radius={[0, 4, 4, 0]}>
                    {data.difficultyBreakdown.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.difficulty === 'Easy' ? '#10b981' : entry.difficulty === 'Medium' ? '#f59e0b' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ── Section 6: Top Quizzes Table ───────────────────────────── */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" /> Top Quizzes by Attempts
            </CardTitle>
            <CardDescription className="text-xs">Most attempted quizzes with performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topQuizzes.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">No quiz data available yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">#</th>
                      <th className="pb-2 pr-4 font-medium">Quiz Title</th>
                      <th className="pb-2 pr-4 font-medium text-center">Attempts</th>
                      <th className="pb-2 pr-4 font-medium text-center">Avg. Score</th>
                      <th className="pb-2 font-medium text-center">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.topQuizzes.map((quiz, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-4 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                        <td className="py-2.5 pr-4 font-medium text-foreground">{quiz.title}</td>
                        <td className="py-2.5 pr-4 text-center">
                          <Badge variant="secondary" className="text-xs font-mono">{quiz.attempts}</Badge>
                        </td>
                        <td className="py-2.5 pr-4 text-center">
                          <span className={`text-xs font-semibold ${quiz.avgScore >= 60 ? 'text-emerald-500' : quiz.avgScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                            {quiz.avgScore}%
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`text-xs font-semibold ${quiz.passRate >= 70 ? 'text-emerald-500' : quiz.passRate >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                            {quiz.passRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Footer (visible on print) ───────────────────────────────── */}
        <div className="text-center text-xs text-muted-foreground pt-2 pb-4 border-t border-border/40 hidden print:block">
          <p className="font-semibold">QuizoraX — Confidential System Report</p>
          <p>Generated on {data.generatedAt} · Super Admin Access Only</p>
        </div>

      </div>
    </>
  );
};

export default AdminReport;
