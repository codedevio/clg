import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Users,
  Download,
  MessageSquare,
  List,
  CheckSquare,
} from 'lucide-react';
import { format } from 'date-fns';

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: 'short_text' | 'long_text' | 'dropdown' | 'checkbox';
  options: string[] | null;
  order_index: number;
}

interface SurveyResponse {
  id: string;
  respondent_name: string | null;
  respondent_email: string | null;
  responses: Record<string, any>;
  created_at: string;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
}

const SurveyResults = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'summary' | 'individual'>('summary');

  useEffect(() => {
    fetchSurveyResults();
  }, [surveyId]);

  const fetchSurveyResults = async () => {
    try {
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (surveyError) throw surveyError;
      setSurvey(surveyData);

      const { data: questionsData, error: questionsError } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('order_index');

      if (questionsError) throw questionsError;
      setQuestions(questionsData as SurveyQuestion[]);

      const { data: responsesData, error: responsesError } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', surveyId)
        .order('created_at', { ascending: false });

      if (responsesError) throw responsesError;
      setResponses(responsesData as SurveyResponse[]);
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

  const getQuestionStats = (question: SurveyQuestion) => {
    if (question.question_type === 'short_text' || question.question_type === 'long_text') {
      const textResponses = responses
        .map(r => r.responses[question.id])
        .filter(Boolean);
      return { type: 'text', responses: textResponses };
    }

    if (question.question_type === 'dropdown' || question.question_type === 'checkbox') {
      const optionCounts: Record<string, number> = {};
      (question.options || []).forEach(opt => optionCounts[opt] = 0);
      
      responses.forEach(r => {
        const answer = r.responses[question.id];
        if (Array.isArray(answer)) {
          answer.forEach(a => {
            if (optionCounts[a] !== undefined) optionCounts[a]++;
          });
        } else if (answer && optionCounts[answer] !== undefined) {
          optionCounts[answer]++;
        }
      });

      return { type: 'options', counts: optionCounts, total: responses.length };
    }

    return null;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!survey) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">Survey not found</h2>
          <Button asChild className="mt-4">
            <Link to="/dashboard/surveys">Back to Surveys</Link>
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/surveys')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{survey.title}</h1>
              <p className="text-muted-foreground">Survey Results & Analytics</p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{responses.length}</p>
                  <p className="text-sm text-muted-foreground">Total Responses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{questions.length}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <List className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {responses.length > 0 
                      ? format(new Date(responses[0].created_at), 'MMM d')
                      : '-'}
                  </p>
                  <p className="text-sm text-muted-foreground">Last Response</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveView('summary')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeView === 'summary'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveView('individual')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeView === 'individual'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Individual Responses ({responses.length})
          </button>
        </div>

        {/* Content */}
        {activeView === 'summary' ? (
          <div className="space-y-6">
            {questions.map((question, index) => {
              const stats = getQuestionStats(question);
              return (
                <Card key={question.id} className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Q{index + 1}. {question.question_text}
                    </CardTitle>
                    <CardDescription>
                      {question.question_type === 'short_text' && 'Short text responses'}
                      {question.question_type === 'long_text' && 'Long text responses'}
                      {question.question_type === 'dropdown' && 'Single choice'}
                      {question.question_type === 'checkbox' && 'Multiple choice'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats?.type === 'text' && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {(stats.responses as string[]).length === 0 ? (
                          <p className="text-muted-foreground">No responses yet</p>
                        ) : (
                          (stats.responses as string[]).map((response, i) => (
                            <div key={i} className="p-3 bg-muted/50 rounded-lg text-sm">
                              {response}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {stats?.type === 'options' && (
                      <div className="space-y-3">
                        {Object.entries(stats.counts as Record<string, number>).map(([option, count]) => (
                          <div key={option} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{option}</span>
                              <span className="text-muted-foreground">
                                {count} ({((count / (stats.total || 1)) * 100).toFixed(0)}%)
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${(count / (stats.total || 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Individual Responses</CardTitle>
              <CardDescription>View each respondent's answers</CardDescription>
            </CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No responses yet. Share your survey link to get responses.
                </div>
              ) : (
                <div className="space-y-4">
                  {responses.map((response, rIndex) => (
                    <Card key={response.id} className="border-border/50">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">
                              {response.respondent_name || `Response #${rIndex + 1}`}
                            </CardTitle>
                            {response.respondent_email && (
                              <CardDescription>{response.respondent_email}</CardDescription>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(response.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {questions.map((q, qIndex) => (
                          <div key={q.id} className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              Q{qIndex + 1}. {q.question_text}
                            </p>
                            <p className="text-sm font-medium">
                              {Array.isArray(response.responses[q.id])
                                ? response.responses[q.id].join(', ')
                                : response.responses[q.id] || '-'}
                            </p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SurveyResults;
