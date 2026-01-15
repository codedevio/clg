import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, Clock, AlertTriangle, ChevronLeft, ChevronRight, Send, Loader2, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Question {
  id: string;
  question_text: string;
  question_text_hindi?: string;
  option_a: string;
  option_a_hindi?: string;
  option_b: string;
  option_b_hindi?: string;
  option_c: string;
  option_c_hindi?: string;
  option_d: string;
  option_d_hindi?: string;
  marks: number;
  order_index: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number;
  shuffle_questions: boolean;
  show_results_to_students: boolean;
  total_marks: number;
  single_attempt: boolean;
}

interface StudentIdentity {
  full_name: string;
  roll_number: string;
  batch: string;
  college_id: string;
}

type Language = 'en' | 'hi';

const TakeQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stage, setStage] = useState<'identity' | 'quiz' | 'submitted' | 'already_attempted'>('identity');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  
  const [studentInfo, setStudentInfo] = useState<StudentIdentity>({
    full_name: '',
    roll_number: '',
    batch: '',
    college_id: '',
  });
  
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptToken, setAttemptToken] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [existingAttemptId, setExistingAttemptId] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      
      try {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .eq('is_published', true)
          .single();

        if (quizError) throw quizError;
        
        setQuiz(quizData);

        const { data: questionsData, error: questionsError } = await supabase
          .rpc('get_quiz_questions_for_attempt', { p_quiz_id: quizId });

        if (questionsError) throw questionsError;
        
        let shuffledQuestions = questionsData || [];
        if (quizData.shuffle_questions) {
          shuffledQuestions = [...shuffledQuestions].sort(() => Math.random() - 0.5);
        }
        
        setQuestions(shuffledQuestions);
        setTimeLeft(quizData.time_limit_minutes * 60);
      } catch (error: any) {
        console.error('Quiz fetch error:', error);
        setQuiz(null);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, navigate, toast]);

  useEffect(() => {
    if (stage !== 'quiz' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  useEffect(() => {
    if (stage !== 'quiz') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        toast({
          variant: 'destructive',
          title: 'Warning',
          description: 'Tab switching is being monitored.',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stage, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartQuiz = async () => {
    if (!studentInfo.full_name || !studentInfo.roll_number || !studentInfo.batch || !studentInfo.college_id) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please fill in all fields.',
      });
      return;
    }

    try {
      // Check for existing attempt if single_attempt is enabled
      if (quiz?.single_attempt) {
        const { data: existingIdentity } = await supabase
          .from('student_identities')
          .select('id')
          .eq('roll_number', studentInfo.roll_number.trim())
          .eq('college_id', studentInfo.college_id.trim())
          .maybeSingle();

        if (existingIdentity) {
          const { data: existingAttempt } = await supabase
            .from('quiz_attempts')
            .select('id, status')
            .eq('quiz_id', quizId)
            .eq('student_identity_id', existingIdentity.id)
            .in('status', ['submitted', 'auto_submitted'])
            .maybeSingle();

          if (existingAttempt) {
            setExistingAttemptId(existingAttempt.id);
            setStage('already_attempted');
            return;
          }
        }
      }

      const studentIdentityId = crypto.randomUUID();
      
      const { error: identityError } = await supabase
        .from('student_identities')
        .insert({
          id: studentIdentityId,
          full_name: studentInfo.full_name,
          roll_number: studentInfo.roll_number,
          batch: studentInfo.batch,
          college_id: studentInfo.college_id,
        });

      if (identityError) throw identityError;

      const newAttemptId = crypto.randomUUID();
      const newAttemptToken = crypto.randomUUID();

      const { error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          id: newAttemptId,
          quiz_id: quizId,
          student_identity_id: studentIdentityId,
          status: 'in_progress',
          attempt_token: newAttemptToken,
        });

      if (attemptError) throw attemptError;

      setAttemptId(newAttemptId);
      setAttemptToken(newAttemptToken);
      setStage('quiz');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error starting quiz',
        description: error.message,
      });
    }
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || !attemptId) return;
    setSubmitting(true);

    try {
      const responses = Object.entries(answers).map(([questionId, selectedOption]) => ({
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: selectedOption,
      }));

      if (responses.length > 0) {
        await supabase.from('quiz_responses').insert(responses);
      }

      const timeSpent = quiz ? (quiz.time_limit_minutes * 60) - timeLeft : 0;
      
      await supabase
        .from('quiz_attempts')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          time_spent_seconds: timeSpent,
          tab_switch_count: tabSwitchCount,
        })
        .eq('id', attemptId);

      setStage('submitted');
      toast({
        title: 'Quiz submitted!',
        description: 'Your responses have been recorded.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error submitting quiz',
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, answers, quiz, timeLeft, tabSwitchCount, submitting, toast]);

  const getQuestionText = (q: Question) => {
    if (language === 'hi' && q.question_text_hindi) {
      return q.question_text_hindi;
    }
    return q.question_text;
  };

  const getOptionText = (q: Question, option: 'A' | 'B' | 'C' | 'D') => {
    const optionKey = `option_${option.toLowerCase()}` as keyof Question;
    const hindiKey = `option_${option.toLowerCase()}_hindi` as keyof Question;
    
    if (language === 'hi' && q[hindiKey]) {
      return q[hindiKey] as string;
    }
    return q[optionKey] as string;
  };

  const attemptedCount = Object.keys(answers).length;
  const unattemptedCount = questions.length - attemptedCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Quiz Not Found</h2>
            <p className="text-muted-foreground mb-4">This quiz doesn't exist or isn't available.</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === 'identity') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-fade-up">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">QuizoraX</span>
          </div>

          <Card className="border-border/50 shadow-elegant">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{quiz.title}</CardTitle>
              {quiz.description && (
                <CardDescription className="mt-2">{quiz.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {quiz.time_limit_minutes} minutes
                </div>
                <div>{questions.length} questions</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2">
                  <Languages className="h-4 w-4" />
                  Exam Language / परीक्षा भाषा *
                </Label>
                <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={studentInfo.full_name}
                    onChange={(e) => setStudentInfo({ ...studentInfo, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rollNumber">Roll Number *</Label>
                    <Input
                      id="rollNumber"
                      value={studentInfo.roll_number}
                      onChange={(e) => setStudentInfo({ ...studentInfo, roll_number: e.target.value })}
                      placeholder="e.g., 2024001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch *</Label>
                    <Input
                      id="batch"
                      value={studentInfo.batch}
                      onChange={(e) => setStudentInfo({ ...studentInfo, batch: e.target.value })}
                      placeholder="e.g., 2024"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collegeId">College ID *</Label>
                  <Input
                    id="collegeId"
                    value={studentInfo.college_id}
                    onChange={(e) => setStudentInfo({ ...studentInfo, college_id: e.target.value })}
                    placeholder="Enter your college ID"
                  />
                </div>
              </div>

              <Button onClick={handleStartQuiz} className="w-full" size="lg">
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (stage === 'already_attempted') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md text-center animate-fade-up">
          <CardContent className="pt-8 pb-6">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Quiz Already Attempted</h2>
            <p className="text-muted-foreground mb-6">
              You have already submitted this quiz. This quiz allows only one attempt per student.
            </p>
            <div className="flex flex-col gap-3">
              {existingAttemptId && quiz?.show_results_to_students && (
                <Button onClick={() => navigate(`/quiz/result/${existingAttemptId}`)}>
                  View Your Results
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/')}>Return Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stage === 'submitted') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md text-center animate-fade-up">
          <CardContent className="pt-8 pb-6">
            <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Quiz Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your responses have been recorded successfully.
            </p>
            <div className="flex flex-col gap-3">
              {attemptId && (
                <Button onClick={() => navigate(`/quiz/result/${attemptId}`)}>
                  View Results
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/')}>Return Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLowTime = timeLeft < 60;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground hidden sm:inline">{quiz.title}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-sm">
                <Languages className="h-4 w-4" />
                <span>{language === 'en' ? 'EN' : 'HI'}</span>
              </div>
              
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold",
                isLowTime ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-muted'
              )}>
                <Clock className="h-5 w-5" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{attemptedCount} answered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <main className="container mx-auto px-4 py-6">
        <Card className="max-w-3xl mx-auto border-border/50 shadow-sm animate-fade-up">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg leading-relaxed">{getQuestionText(question)}</CardTitle>
              <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                {question.marks} mark{question.marks > 1 ? 's' : ''}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['A', 'B', 'C', 'D'] as const).map((option) => {
              const isSelected = answers[question.id] === option;
              
              return (
                <button
                  key={option}
                  onClick={() => setAnswers({ ...answers, [question.id]: option })}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium shrink-0",
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      {option}
                    </span>
                    <span className="pt-0.5">{getOptionText(question, option)}</span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="border-b border-border bg-muted/50">
          <div className="container mx-auto px-4 py-3 max-w-3xl">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary"></div>
                <span>
                  <span className="font-semibold">{attemptedCount}</span>
                  <span className="text-muted-foreground ml-1">Attempted</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted-foreground/30"></div>
                <span>
                  <span className="font-semibold">{unattemptedCount}</span>
                  <span className="text-muted-foreground ml-1">Unattempted</span>
                </span>
              </div>
              <div className="text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{questions.length}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentQuestion === questions.length - 1 ? (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeQuiz;
