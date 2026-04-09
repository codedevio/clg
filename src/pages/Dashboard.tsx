import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FileText, ClipboardList, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';

interface Quiz {
  id: string;
  title: string;
  is_published: boolean;
  created_at: string;
}

interface Survey {
  id: string;
  title: string;
  is_published: boolean;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { isStudent, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalSurveys: 0,
    totalResponses: 0,
    avgCompletion: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      // Wait for roles to load
      if (roleLoading) return;

      // If user is a student, redirect to their personal dashboard
      if (isStudent) {
        navigate('/dashboard/my-results', { replace: true });
        return;
      }

      if (!user) return;
      
      try {
        // Fetch quizzes
        const { data: quizzesData } = await supabase
          .from('quizzes')
          .select('id, title, is_published, created_at')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Fetch surveys
        const { data: surveysData } = await supabase
          .from('surveys')
          .select('id, title, is_published, created_at')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        // Get counts
        const quizIds = (quizzesData || []).map(q => q.id);
        const surveyIds = (surveysData || []).map(s => s.id);
        
        const [quizCount, surveyCount, quizAttemptsCount, surveyResponsesCount] = await Promise.all([
          supabase.from('quizzes').select('id', { count: 'exact', head: true }).eq('creator_id', user.id),
          supabase.from('surveys').select('id', { count: 'exact', head: true }).eq('creator_id', user.id),
          quizIds.length > 0 
            ? supabase.from('quiz_attempts').select('id, quiz_id', { count: 'exact' }).in('quiz_id', quizIds)
            : Promise.resolve({ count: 0 }),
          surveyIds.length > 0
            ? supabase.from('survey_responses').select('id, survey_id', { count: 'exact' }).in('survey_id', surveyIds)
            : Promise.resolve({ count: 0 }),
        ]);

        const totalResponses = (quizAttemptsCount.count || 0) + (surveyResponsesCount.count || 0);
        
        // Calculate average completion percentage from quiz attempts that were submitted
        let avgCompletion = 0;
        if (quizIds.length > 0) {
          const { data: submittedAttempts } = await supabase
            .from('quiz_attempts')
            .select('percentage')
            .in('quiz_id', quizIds)
            .in('status', ['submitted', 'auto_submitted']);
          
          avgCompletion = submittedAttempts && submittedAttempts.length > 0
            ? Math.round(submittedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / submittedAttempts.length)
            : 0;
        }

        setQuizzes(quizzesData || []);
        setSurveys(surveysData || []);
        setStats({
          totalQuizzes: quizCount.count || 0,
          totalSurveys: surveyCount.count || 0,
          totalResponses,
          avgCompletion,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isStudent, roleLoading, navigate]);

  // If redirecting, don't flash the UI
  if (roleLoading || isStudent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: 'Total Quizzes', value: stats.totalQuizzes.toString(), icon: FileText, color: 'bg-primary' },
    { label: 'Total Surveys', value: stats.totalSurveys.toString(), icon: ClipboardList, color: 'bg-accent' },
    { label: 'Total Responses', value: stats.totalResponses.toString(), icon: Users, color: 'bg-amber-500' },
    { label: 'Avg. Completion', value: `${stats.avgCompletion}%`, icon: TrendingUp, color: 'bg-navy-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-up">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Welcome back, {firstName}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your quizzes and surveys.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link to="/dashboard/quizzes/new">
                <Plus className="h-4 w-4 mr-2" />
                New Quiz
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/surveys/new">
                <Plus className="h-4 w-4 mr-2" />
                New Survey
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)
          ) : (
            statCards.map((stat) => (
              <Card key={stat.label} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Quizzes
              </CardTitle>
              <CardDescription>Your latest quiz activities</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : quizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">No quizzes created yet</p>
                  <Button asChild size="sm">
                    <Link to="/dashboard/quizzes/new">
                      Create Your First Quiz
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizzes.map((quiz) => (
                    <Link
                      key={quiz.id}
                      to={`/dashboard/quizzes/${quiz.id}/edit`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium truncate">{quiz.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={quiz.is_published ? 'default' : 'secondary'} className="text-xs">
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(quiz.created_at), 'MMM d')}
                        </span>
                      </div>
                    </Link>
                  ))}
                  <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                    <Link to="/dashboard/quizzes">
                      View All Quizzes
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-accent" />
                Recent Surveys
              </CardTitle>
              <CardDescription>Your latest survey activities</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : surveys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">No surveys created yet</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/dashboard/surveys/new">
                      Create Your First Survey
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {surveys.map((survey) => (
                    <Link
                      key={survey.id}
                      to={`/dashboard/surveys/${survey.id}/edit`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium truncate">{survey.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={survey.is_published ? 'default' : 'secondary'} className="text-xs">
                          {survey.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(survey.created_at), 'MMM d')}
                        </span>
                      </div>
                    </Link>
                  ))}
                  <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                    <Link to="/dashboard/surveys">
                      View All Surveys
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
