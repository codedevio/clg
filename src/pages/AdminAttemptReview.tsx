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
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  User,
  AlertTriangle,
  Printer,
} from 'lucide-react';
import { format } from 'date-fns';

interface QuizQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  marks: number;
  order_index: number;
}

interface QuizResponse {
  id: string;
  question_id: string;
  selected_option: string | null;
  is_correct: boolean | null;
  marks_awarded: number | null;
}

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
  started_at: string;
  status: string;
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
  total_marks: number;
}

const AdminAttemptReview = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const handlePrint = () => {
    window.print();
  };

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (user) {
      checkAccess();
    }
  }, [user, attemptId]);

  const checkAccess = async () => {
    try {
      // Check if user is admin
      const { data: roleData } = await supabase
        .rpc('has_role', { _user_id: user!.id, _role: 'admin' });
      
      setIsAdmin(roleData === true);

      // Fetch attempt data
      const { data: attemptData, error: attemptError } = await supabase
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
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;
      setAttempt(attemptData as QuizAttempt);

      // Fetch quiz data
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('id, title, total_marks, creator_id')
        .eq('id', attemptData.quiz_id)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);
      setIsCreator(quizData.creator_id === user!.id);

      // Check if user has access (admin or creator)
      if (roleData !== true && quizData.creator_id !== user!.id) {
        toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to view this attempt.',
        });
        navigate('/dashboard/quizzes');
        return;
      }

      // Fetch questions with correct answers
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', attemptData.quiz_id)
        .order('order_index');

      if (questionsError) throw questionsError;
      setQuestions(questionsData as QuizQuestion[]);

      // Fetch responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('attempt_id', attemptId);

      if (responsesError) throw responsesError;
      setResponses(responsesData as QuizResponse[]);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading attempt',
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

  const getResponseForQuestion = (questionId: string) => {
    return responses.find(r => r.question_id === questionId);
  };

  const getOptionText = (question: QuizQuestion, option: string) => {
    switch (option) {
      case 'A': return question.option_a;
      case 'B': return question.option_b;
      case 'C': return question.option_c;
      case 'D': return question.option_d;
      default: return '';
    }
  };

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

  if (!attempt || !quiz) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">Attempt not found</h2>
          <Button asChild className="mt-4">
            <Link to="/dashboard/quizzes">Back to Quizzes</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* ── Print-only styles ────────────────────────────────────── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #student-result-slip, #student-result-slip * { visibility: visible !important; }
          #student-result-slip {
            position: absolute; left: 0; top: 0;
            width: 100%; padding: 24px; font-family: Arial, sans-serif;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ── Hidden printable result slip ─────────────────────────── */}
      <div id="student-result-slip" style={{ display: 'none' }}>
        <style>{`
          @media screen { #student-result-slip { display: none !important; } }
          @media print  { #student-result-slip { display: block !important; } }
        `}</style>

        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: 12, marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Individual Result Slip</h1>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '4px 0 0' }}>{quiz.title}</h2>
          <p style={{ fontSize: 11, color: '#666', margin: '2px 0 0' }}>Generated: {format(new Date(), 'dd MMM yyyy, hh:mm a')}</p>
        </div>

        {/* Student + Score info in two columns */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          {/* Student Info */}
          <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, borderBottom: '1px solid #eee', paddingBottom: 4 }}>Student Information</h3>
            {[
              ['Name', attempt.student_identities?.full_name],
              ['Roll Number', attempt.student_identities?.roll_number],
              ['Batch', attempt.student_identities?.batch],
              ['College ID', attempt.student_identities?.college_id],
            ].map(([label, value]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#666' }}>{label}:</span>
                <span style={{ fontWeight: 600 }}>{value || '-'}</span>
              </div>
            ))}
          </div>

          {/* Score Summary */}
          <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, borderBottom: '1px solid #eee', paddingBottom: 4 }}>Attempt Summary</h3>
            {[
              ['Score', `${attempt.score ?? 0} / ${quiz.total_marks}`],
              ['Percentage', `${attempt.percentage?.toFixed(1) ?? 0}%`],
              ['Result', attempt.passed ? 'PASSED ✓' : 'FAILED ✗'],
              ['Correct Answers', String(attempt.correct_count ?? 0)],
              ['Wrong Answers', String(attempt.wrong_count ?? 0)],
              ['Unanswered', String(attempt.unanswered_count ?? 0)],
              ['Time Taken', formatDuration(attempt.time_spent_seconds)],
              ['Tab Switches', String(attempt.tab_switch_count ?? 0)],
              ['Submitted At', attempt.submitted_at ? format(new Date(attempt.submitted_at), 'dd/MM/yyyy hh:mm a') : '-'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#666' }}>{label}:</span>
                <span style={{ fontWeight: 600, color: label === 'Result' ? (attempt.passed ? 'green' : 'red') : 'inherit' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signature footer */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666' }}>
          <span>Student Signature: _______________________</span>
          <span>Examiner Signature: _______________________</span>
          <span style={{ fontStyle: 'italic' }}>QuizoraX — Confidential</span>
        </div>
      </div>

      {/* ── Regular on-screen view ───────────────────────────────── */}
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/dashboard/quizzes/${quiz.id}/results`)}
              className="no-print"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
              <p className="text-muted-foreground">
                Answer Review - {attempt.student_identities?.full_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 no-print">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Result
            </Button>
            <Badge variant={isAdmin ? 'default' : 'secondary'}>
              {isAdmin ? 'Admin Access' : 'Creator Access'}
            </Badge>
          </div>
        </div>

        {/* Student Info & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{attempt.student_identities?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Roll Number:</span>
                <span>{attempt.student_identities?.roll_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch:</span>
                <span>{attempt.student_identities?.batch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">College ID:</span>
                <span>{attempt.student_identities?.college_id}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Attempt Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score:</span>
                <span className="font-medium">
                  {attempt.score ?? 0}/{quiz.total_marks} ({attempt.percentage?.toFixed(1) ?? 0}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Result:</span>
                <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                  {attempt.passed ? 'Passed' : 'Failed'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Taken:</span>
                <span>{formatDuration(attempt.time_spent_seconds)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Tab Switches:</span>
                <Badge variant={(attempt.tab_switch_count ?? 0) > 2 ? 'destructive' : 'secondary'}>
                  {attempt.tab_switch_count ?? 0}
                  {(attempt.tab_switch_count ?? 0) > 2 && (
                    <AlertTriangle className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted:</span>
                <span>
                  {attempt.submitted_at 
                    ? format(new Date(attempt.submitted_at), 'MMM d, yyyy h:mm a')
                    : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions & Answers */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Questions & Answers</CardTitle>
            <CardDescription>
              Review all questions with student responses and correct answers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((question, index) => {
              const response = getResponseForQuestion(question.id);
              const studentAnswer = response?.selected_option;
              const isCorrect = response?.is_correct;
              const isUnanswered = !studentAnswer;

              return (
                <div 
                  key={question.id} 
                  className={`p-4 rounded-lg border ${
                    isUnanswered 
                      ? 'border-muted bg-muted/20'
                      : isCorrect 
                        ? 'border-accent/50 bg-accent/5' 
                        : 'border-destructive/50 bg-destructive/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Q{index + 1}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {question.marks} marks
                      </Badge>
                    </div>
                    {isUnanswered ? (
                      <Badge variant="secondary">
                        <MinusCircle className="h-3 w-3 mr-1" />
                        Unanswered
                      </Badge>
                    ) : isCorrect ? (
                      <Badge variant="default" className="bg-accent">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Correct (+{response?.marks_awarded})
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Wrong ({response?.marks_awarded ?? 0})
                      </Badge>
                    )}
                  </div>

                  <p className="font-medium mb-4">{question.question_text}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {['A', 'B', 'C', 'D'].map((opt) => {
                      const isCorrectOption = question.correct_option === opt;
                      const isStudentChoice = studentAnswer === opt;
                      
                      return (
                        <div
                          key={opt}
                          className={`p-3 rounded-md border text-sm ${
                            isCorrectOption && isStudentChoice
                              ? 'border-accent bg-accent/10 text-accent-foreground'
                              : isCorrectOption
                                ? 'border-accent bg-accent/10'
                                : isStudentChoice
                                  ? 'border-destructive bg-destructive/10'
                                  : 'border-border bg-background'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{opt}.</span>
                            <span className="flex-1">{getOptionText(question, opt)}</span>
                            {isCorrectOption && (
                              <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                            )}
                            {isStudentChoice && !isCorrectOption && (
                              <XCircle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAttemptReview;