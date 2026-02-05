import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CSVQuestionUpload from '@/components/quiz/CSVQuestionUpload';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  Loader2,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isNew?: boolean;
}

const QuizEdit = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'questions' | 'settings'>('details');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  
  const [settings, setSettings] = useState({
    timeLimit: 30,
    totalMarks: 100,
    negativeMarking: false,
    negativeMarksPerWrong: 0,
    shuffleQuestions: true,
    showResultsToStudents: false,
    passingPercentage: 40,
    firstPositionMin: 90,
    secondPositionMin: 75,
    thirdPositionMin: 60,
    maxAttempts: 1 as number | null,
  });

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      setTitle(quiz.title);
      setDescription(quiz.description || '');
      setIsPublished(quiz.is_published);
      setSettings({
        timeLimit: quiz.time_limit_minutes,
        totalMarks: quiz.total_marks,
        negativeMarking: quiz.negative_marking,
        negativeMarksPerWrong: quiz.negative_marks_per_wrong || 0,
        shuffleQuestions: quiz.shuffle_questions,
        showResultsToStudents: quiz.show_results_to_students,
        passingPercentage: quiz.passing_percentage || 40,
        firstPositionMin: quiz.first_position_min || 90,
        secondPositionMin: quiz.second_position_min || 75,
        thirdPositionMin: quiz.third_position_min || 60,
        maxAttempts: quiz.max_attempts,
      });

      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('is_archived', false)
        .order('order_index');

      if (questionsError) throw questionsError;

      setQuestions(questionsData.map(q => ({
        ...q,
        correct_option: q.correct_option as 'A' | 'B' | 'C' | 'D',
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
      })));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading quiz',
        description: error.message,
      });
      navigate('/dashboard/quizzes');
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A',
      marks: 1,
      difficulty: 'medium',
      isNew: true,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string, isNew?: boolean) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (!isNew) {
      setDeletedQuestionIds([...deletedQuestionIds, id]);
    }
  };

  const handleQuestionsImported = (importedQuestions: Question[]) => {
    const questionsWithNewFlag = importedQuestions.map(q => ({ ...q, isNew: true }));
    setQuestions([...questions, ...questionsWithNewFlag]);
  };

  const handleSave = async (publish?: boolean) => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Title required' });
      setActiveTab('details');
      return;
    }

    if (questions.length === 0) {
      toast({ variant: 'destructive', title: 'Questions required' });
      setActiveTab('questions');
      return;
    }

    for (const q of questions) {
      if (!q.question_text.trim() || !q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        toast({ variant: 'destructive', title: 'Incomplete question', description: 'Please fill in all question fields.' });
        setActiveTab('questions');
        return;
      }
    }

    setIsSaving(true);

    try {
      // Update quiz
      const { error: quizError } = await supabase
        .from('quizzes')
        .update({
          title,
          description,
          time_limit_minutes: settings.timeLimit,
          total_marks: settings.totalMarks,
          negative_marking: settings.negativeMarking,
          negative_marks_per_wrong: settings.negativeMarksPerWrong,
          shuffle_questions: settings.shuffleQuestions,
          show_results_to_students: settings.showResultsToStudents,
          is_published: publish !== undefined ? publish : isPublished,
          passing_percentage: settings.passingPercentage,
          first_position_min: settings.firstPositionMin,
          second_position_min: settings.secondPositionMin,
          third_position_min: settings.thirdPositionMin,
          max_attempts: settings.maxAttempts,
        })
        .eq('id', quizId);

      if (quizError) throw quizError;

      // Delete removed questions
      if (deletedQuestionIds.length > 0) {
        await supabase
          .from('quiz_questions')
          .update({ is_archived: true, archived_at: new Date().toISOString() })
          .in('id', deletedQuestionIds);
      }

      // Upsert questions
      const existingQuestions = questions.filter(q => !q.isNew);
      const newQuestions = questions.filter(q => q.isNew);

      for (const q of existingQuestions) {
        await supabase
          .from('quiz_questions')
          .update({
            question_text: q.question_text,
            option_a: q.option_a,
            option_b: q.option_b,
            option_c: q.option_c,
            option_d: q.option_d,
            correct_option: q.correct_option,
            marks: q.marks,
            difficulty: q.difficulty,
            order_index: questions.indexOf(q),
          })
          .eq('id', q.id);
      }

      if (newQuestions.length > 0) {
        const inserts = newQuestions.map((q, i) => ({
          quiz_id: quizId,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          marks: q.marks,
          difficulty: q.difficulty,
          order_index: existingQuestions.length + i,
        }));

        await supabase.from('quiz_questions').insert(inserts);
      }

      toast({
        title: publish ? 'Quiz published!' : 'Quiz updated!',
        description: publish ? 'Your quiz is now live.' : 'Changes saved successfully.',
      });

      navigate('/dashboard/quizzes');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving quiz',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
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
              <h1 className="text-2xl font-bold text-foreground">Edit Quiz</h1>
              <p className="text-muted-foreground">Update your quiz details and questions</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleSave()} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
            {!isPublished && (
              <Button onClick={() => handleSave(true)} disabled={isSaving}>
                <Eye className="h-4 w-4 mr-2" />
                Publish
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {[
            { id: 'details', label: 'Details', icon: HelpCircle },
            { id: 'questions', label: `Questions (${questions.length})`, icon: HelpCircle },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
              <CardDescription>Basic information about your quiz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Mathematics Final Exam"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide instructions or details about the quiz..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-4">
            <CSVQuestionUpload onQuestionsImported={handleQuestionsImported} />

            {questions.map((question, index) => (
              <Card key={question.id} className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <CardTitle className="text-base">Question {index + 1}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(question.id, question.isNew)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question Text *</Label>
                    <Textarea
                      value={question.question_text}
                      onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                      placeholder="Enter your question..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(['A', 'B', 'C', 'D'] as const).map((option) => (
                      <div key={option} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Option {option} *</Label>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correct_option === option}
                              onChange={() => updateQuestion(question.id, { correct_option: option })}
                              className="accent-accent"
                            />
                            Correct
                          </label>
                        </div>
                        <Input
                          value={question[`option_${option.toLowerCase()}` as keyof Question] as string}
                          onChange={(e) => updateQuestion(question.id, { [`option_${option.toLowerCase()}`]: e.target.value })}
                          placeholder={`Option ${option}`}
                          className={cn(
                            question.correct_option === option && 'border-accent ring-1 ring-accent/20'
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="space-y-2">
                      <Label>Marks</Label>
                      <Input
                        type="number"
                        min={1}
                        value={question.marks}
                        onChange={(e) => updateQuestion(question.id, { marks: parseInt(e.target.value) || 1 })}
                        className="w-24"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <select
                        value={question.difficulty}
                        onChange={(e) => updateQuestion(question.id, { difficulty: e.target.value as Question['difficulty'] })}
                        className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button onClick={addQuestion} variant="outline" className="w-full py-8 border-dashed">
              <Plus className="h-5 w-5 mr-2" />
              Add Question
            </Button>
          </div>
        )}

        {activeTab === 'settings' && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Quiz Settings</CardTitle>
              <CardDescription>Configure quiz behavior and rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min={1}
                    value={settings.timeLimit}
                    onChange={(e) => setSettings({ ...settings, timeLimit: parseInt(e.target.value) || 30 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    min={1}
                    value={settings.totalMarks}
                    onChange={(e) => setSettings({ ...settings, totalMarks: parseInt(e.target.value) || 100 })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Shuffle Questions</p>
                    <p className="text-sm text-muted-foreground">Randomize question order for each student</p>
                  </div>
                  <Switch
                    checked={settings.shuffleQuestions}
                    onCheckedChange={(checked) => setSettings({ ...settings, shuffleQuestions: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Show Results</p>
                    <p className="text-sm text-muted-foreground">Allow students to see their results after submission</p>
                  </div>
                  <Switch
                    checked={settings.showResultsToStudents}
                    onCheckedChange={(checked) => setSettings({ ...settings, showResultsToStudents: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Attempt Limit</p>
                    <p className="text-sm text-muted-foreground">Maximum number of attempts allowed per student</p>
                  </div>
                  <select
                    value={settings.maxAttempts === null ? 'unlimited' : settings.maxAttempts.toString()}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      maxAttempts: e.target.value === 'unlimited' ? null : parseInt(e.target.value) 
                    })}
                    className="h-10 px-3 rounded-lg border border-input bg-background text-sm min-w-[140px]"
                  >
                    <option value="1">1 Attempt</option>
                    <option value="2">2 Attempts</option>
                    <option value="3">3 Attempts</option>
                    <option value="5">5 Attempts</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Negative Marking</p>
                    <p className="text-sm text-muted-foreground">Deduct marks for wrong answers</p>
                  </div>
                  <Switch
                    checked={settings.negativeMarking}
                    onCheckedChange={(checked) => setSettings({ ...settings, negativeMarking: checked })}
                  />
                </div>

                {settings.negativeMarking && (
                  <div className="space-y-2 ml-6">
                    <Label>Negative Marks per Wrong Answer</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.25}
                      value={settings.negativeMarksPerWrong}
                      onChange={(e) => setSettings({ ...settings, negativeMarksPerWrong: parseFloat(e.target.value) || 0 })}
                      className="w-32"
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Grading Thresholds */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-1">Grading Thresholds</h3>
                  <p className="text-sm text-muted-foreground">Set percentage thresholds for passing and positions</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passingPercentage">Passing % (Pass/Fail)</Label>
                    <Input
                      id="passingPercentage"
                      type="number"
                      min={0}
                      max={100}
                      value={settings.passingPercentage}
                      onChange={(e) => setSettings({ ...settings, passingPercentage: parseFloat(e.target.value) || 40 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstPositionMin">1st Position Min %</Label>
                    <Input
                      id="firstPositionMin"
                      type="number"
                      min={0}
                      max={100}
                      value={settings.firstPositionMin}
                      onChange={(e) => setSettings({ ...settings, firstPositionMin: parseFloat(e.target.value) || 90 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondPositionMin">2nd Position Min %</Label>
                    <Input
                      id="secondPositionMin"
                      type="number"
                      min={0}
                      max={100}
                      value={settings.secondPositionMin}
                      onChange={(e) => setSettings({ ...settings, secondPositionMin: parseFloat(e.target.value) || 75 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thirdPositionMin">3rd Position Min %</Label>
                    <Input
                      id="thirdPositionMin"
                      type="number"
                      min={0}
                      max={100}
                      value={settings.thirdPositionMin}
                      onChange={(e) => setSettings({ ...settings, thirdPositionMin: parseFloat(e.target.value) || 60 })}
                    />
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p><strong>Position Logic:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>🥇 1st Position: ≥ {settings.firstPositionMin}%</li>
                    <li>🥈 2nd Position: ≥ {settings.secondPositionMin}% and &lt; {settings.firstPositionMin}%</li>
                    <li>🥉 3rd Position: ≥ {settings.thirdPositionMin}% and &lt; {settings.secondPositionMin}%</li>
                    <li>✅ Pass: ≥ {settings.passingPercentage}% and &lt; {settings.thirdPositionMin}%</li>
                    <li>❌ Fail: &lt; {settings.passingPercentage}%</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuizEdit;
