import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Clock, FileText, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';

interface AnalyticsData {
  totalAttempts: number;
  avgScore: number;
  completionRate: number;
  avgDuration: number;
  totalQuizzes: number;
  totalSurveys: number;
  totalSurveyResponses: number;
  dailyAttempts: { date: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
  quizPerformance: { name: string; attempts: number; avgScore: number }[];
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    totalAttempts: 0,
    avgScore: 0,
    completionRate: 0,
    avgDuration: 0,
    totalQuizzes: 0,
    totalSurveys: 0,
    totalSurveyResponses: 0,
    dailyAttempts: [],
    scoreDistribution: [],
    quizPerformance: [],
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch user's quizzes
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('creator_id', user?.id);

      const quizIds = quizzes?.map(q => q.id) || [];

      // Fetch user's surveys
      const { data: surveys } = await supabase
        .from('surveys')
        .select('id')
        .eq('creator_id', user?.id);

      const surveyIds = surveys?.map(s => s.id) || [];

      // Fetch quiz attempts for user's quizzes
      let attempts: any[] = [];
      if (quizIds.length > 0) {
        const { data: attemptData } = await supabase
          .from('quiz_attempts')
          .select('*')
          .in('quiz_id', quizIds)
          .in('status', ['submitted', 'auto_submitted']);
        attempts = attemptData || [];
      }

      // Fetch survey responses for user's surveys
      let surveyResponses: any[] = [];
      if (surveyIds.length > 0) {
        const { data: responseData } = await supabase
          .from('survey_responses')
          .select('*')
          .in('survey_id', surveyIds);
        surveyResponses = responseData || [];
      }

      // Calculate metrics
      const totalAttempts = attempts.length;
      const avgScore = totalAttempts > 0
        ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalAttempts
        : 0;
      
      const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'auto_submitted').length;
      const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
      
      const avgDuration = totalAttempts > 0
        ? attempts.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) / totalAttempts / 60
        : 0;

      // Calculate daily attempts for last 7 days
      const last7Days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date()
      });

      const dailyAttempts = last7Days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const count = attempts.filter(a => {
          const attemptDate = new Date(a.submitted_at || a.created_at);
          return attemptDate >= dayStart && attemptDate < dayEnd;
        }).length;

        return {
          date: format(day, 'MMM dd'),
          count
        };
      });

      // Calculate score distribution
      const scoreRanges = [
        { range: '0-20%', min: 0, max: 20 },
        { range: '21-40%', min: 21, max: 40 },
        { range: '41-60%', min: 41, max: 60 },
        { range: '61-80%', min: 61, max: 80 },
        { range: '81-100%', min: 81, max: 100 },
      ];

      const scoreDistribution = scoreRanges.map(range => ({
        range: range.range,
        count: attempts.filter(a => {
          const score = a.percentage || 0;
          return score >= range.min && score <= range.max;
        }).length
      }));

      // Calculate quiz performance
      const quizPerformance = (quizzes || []).map(quiz => {
        const quizAttempts = attempts.filter(a => a.quiz_id === quiz.id);
        const avgQuizScore = quizAttempts.length > 0
          ? quizAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / quizAttempts.length
          : 0;
        
        return {
          name: quiz.title.length > 15 ? quiz.title.substring(0, 15) + '...' : quiz.title,
          attempts: quizAttempts.length,
          avgScore: Math.round(avgQuizScore)
        };
      }).slice(0, 5);

      setData({
        totalAttempts,
        avgScore: Math.round(avgScore),
        completionRate: Math.round(completionRate),
        avgDuration: Math.round(avgDuration),
        totalQuizzes: quizzes?.length || 0,
        totalSurveys: surveys?.length || 0,
        totalSurveyResponses: surveyResponses.length,
        dailyAttempts,
        scoreDistribution,
        quizPerformance,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { label: 'Total Attempts', value: data.totalAttempts.toString(), icon: Users, color: 'text-chart-1' },
    { label: 'Avg. Score', value: `${data.avgScore}%`, icon: TrendingUp, color: 'text-chart-2' },
    { label: 'Completion Rate', value: `${data.completionRate}%`, icon: BarChart3, color: 'text-chart-3' },
    { label: 'Avg. Duration', value: `${data.avgDuration}m`, icon: Clock, color: 'text-chart-4' },
  ];

  const summaryMetrics = [
    { label: 'Total Quizzes', value: data.totalQuizzes, icon: FileText },
    { label: 'Total Surveys', value: data.totalSurveys, icon: ClipboardList },
    { label: 'Survey Responses', value: data.totalSurveyResponses, icon: Users },
  ];

  const chartConfig = {
    count: { label: 'Attempts', color: 'hsl(var(--chart-1))' },
    avgScore: { label: 'Avg Score', color: 'hsl(var(--chart-2))' },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track performance and insights across your quizzes and surveys
          </p>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? '...' : metric.value}
                </p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {summaryMetrics.map((metric) => (
            <Card key={metric.label} className="border-border/50 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <metric.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    {loading ? '...' : metric.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="scores">Scores</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="mt-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Response Trends</CardTitle>
                <CardDescription>Quiz attempts over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {data.dailyAttempts.some(d => d.count > 0) ? (
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.dailyAttempts}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" className="text-muted-foreground text-xs" />
                        <YAxis className="text-muted-foreground text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(var(--chart-1))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--chart-1))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No attempts in the last 7 days</p>
                      <p className="text-sm">Share your quizzes to see trends</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scores" className="mt-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Score Distribution</CardTitle>
                <CardDescription>Performance breakdown across all quizzes</CardDescription>
              </CardHeader>
              <CardContent>
                {data.scoreDistribution.some(d => d.count > 0) ? (
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.scoreDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="range" className="text-muted-foreground text-xs" />
                        <YAxis className="text-muted-foreground text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No score data available</p>
                      <p className="text-sm">Complete quiz attempts to see distribution</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="mt-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Quiz Performance</CardTitle>
                <CardDescription>Attempts and average scores per quiz</CardDescription>
              </CardHeader>
              <CardContent>
                {data.quizPerformance.length > 0 && data.quizPerformance.some(q => q.attempts > 0) ? (
                  <ChartContainer config={chartConfig} className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.quizPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-muted-foreground text-xs" />
                        <YAxis dataKey="name" type="category" width={100} className="text-muted-foreground text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="attempts" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No quiz performance data</p>
                      <p className="text-sm">Create quizzes and get attempts to see performance</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
