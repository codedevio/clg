import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, AlertTriangle, Send, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/SEO';

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: 'short_text' | 'long_text' | 'dropdown' | 'checkbox';
  options: string[] | null;
  is_required: boolean;
  order_index: number;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
}

const TakeSurvey = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [respondentName, setRespondentName] = useState('');
  const [respondentEmail, setRespondentEmail] = useState('');
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!surveyId) return;

      try {
        const { data: surveyData, error: surveyError } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', surveyId)
          .eq('is_published', true)
          .single();

        if (surveyError) throw surveyError;

        setSurvey(surveyData);

        const { data: questionsData, error: questionsError } = await supabase
          .from('survey_questions')
          .select('*')
          .eq('survey_id', surveyId)
          .order('order_index');

        if (questionsError) throw questionsError;

        setQuestions(questionsData?.map(q => ({
          ...q,
          options: q.options as string[] | null
        })) || []);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Survey not found',
          description: 'This survey may not exist or is not published.',
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId, navigate, toast]);

  const handleSubmit = async () => {
    // Validate required fields
    for (const question of questions) {
      if (question.is_required) {
        const answer = responses[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0)) {
          toast({
            variant: 'destructive',
            title: 'Missing required answer',
            description: `Please answer: "${question.question_text}"`,
          });
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      await supabase.from('survey_responses').insert({
        survey_id: surveyId,
        respondent_name: respondentName || null,
        respondent_email: respondentEmail || null,
        responses: responses,
      });

      setSubmitted(true);
      toast({
        title: 'Survey submitted!',
        description: 'Thank you for your response.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error submitting survey',
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateResponse = (questionId: string, value: string | string[]) => {
    setResponses({ ...responses, [questionId]: value });
  };

  const toggleCheckbox = (questionId: string, option: string) => {
    const current = (responses[questionId] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
    updateResponse(questionId, updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SEO title="Loading Survey... | Quizorax" />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SEO title="Survey Not Found | Quizorax" />
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Survey Not Found</h2>
            <p className="text-muted-foreground mb-4">This survey doesn't exist or isn't available.</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <SEO title="Survey Submitted | Quizorax" />
        <Card className="max-w-md text-center animate-fade-up">
          <CardContent className="pt-8 pb-6">
            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your response has been recorded successfully.
            </p>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${survey.title} | Quizorax`} description={survey.description || "Take this survey on Quizorax"} />
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">QuizoraX</span>
          </div>
        </div>
      </header>

      {/* Survey Form */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6 animate-fade-up">
          {/* Survey Header */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">{survey.title}</CardTitle>
              {survey.description && (
                <CardDescription className="text-base mt-2">{survey.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name (optional)</Label>
                  <Input
                    id="name"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={respondentEmail}
                    onChange={(e) => setRespondentEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          {questions.map((question, index) => (
            <Card key={question.id} className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-start gap-2">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  {question.question_text}
                  {question.is_required && <span className="text-destructive">*</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {question.question_type === 'short_text' && (
                  <Input
                    value={(responses[question.id] as string) || ''}
                    onChange={(e) => updateResponse(question.id, e.target.value)}
                    placeholder="Your answer..."
                  />
                )}

                {question.question_type === 'long_text' && (
                  <Textarea
                    value={(responses[question.id] as string) || ''}
                    onChange={(e) => updateResponse(question.id, e.target.value)}
                    placeholder="Your answer..."
                    rows={4}
                  />
                )}

                {question.question_type === 'dropdown' && question.options && (
                  <RadioGroup
                    value={(responses[question.id] as string) || ''}
                    onValueChange={(value) => updateResponse(question.id, value)}
                  >
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-3 py-2">
                        <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                        <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.question_type === 'checkbox' && question.options && (
                  <div className="space-y-3">
                    {question.options.map((option, optIndex) => {
                      const checked = ((responses[question.id] as string[]) || []).includes(option);
                      return (
                        <div key={optIndex} className="flex items-center space-x-3">
                          <Checkbox
                            id={`${question.id}-${optIndex}`}
                            checked={checked}
                            onCheckedChange={() => toggleCheckbox(question.id, option)}
                          />
                          <Label htmlFor={`${question.id}-${optIndex}`} className="font-normal cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Submit Button */}
          <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Submit Response
          </Button>
        </div>
      </main>
    </div>
  );
};

export default TakeSurvey;
