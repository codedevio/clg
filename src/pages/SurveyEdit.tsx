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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  Loader2,
  Type,
  List,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type QuestionType = 'short_text' | 'long_text' | 'dropdown' | 'checkbox';

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  is_required: boolean;
  isNew?: boolean;
}

const questionTypeIcons: Record<QuestionType, React.ElementType> = {
  short_text: Type,
  long_text: Type,
  dropdown: List,
  checkbox: CheckSquare,
};

const questionTypeLabels: Record<QuestionType, string> = {
  short_text: 'Short Text',
  long_text: 'Long Text',
  dropdown: 'Dropdown',
  checkbox: 'Checkboxes',
};

const SurveyEdit = () => {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);

  useEffect(() => {
    fetchSurvey();
  }, [surveyId]);

  const fetchSurvey = async () => {
    try {
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (surveyError) throw surveyError;

      setTitle(survey.title);
      setDescription(survey.description || '');
      setIsPublished(survey.is_published);

      const { data: questionsData, error: questionsError } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('order_index');

      if (questionsError) throw questionsError;

      setQuestions(questionsData.map(q => ({
        ...q,
        question_type: q.question_type as QuestionType,
        options: (q.options as string[]) || [],
      })));
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading survey',
        description: error.message,
      });
      navigate('/dashboard/surveys');
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: SurveyQuestion = {
      id: crypto.randomUUID(),
      question_text: '',
      question_type: type,
      options: type === 'dropdown' || type === 'checkbox' ? ['Option 1', 'Option 2'] : [],
      is_required: false,
      isNew: true,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string, isNew?: boolean) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (!isNew) {
      setDeletedQuestionIds([...deletedQuestionIds, id]);
    }
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      updateQuestion(questionId, { options: [...question.options, `Option ${question.options.length + 1}`] });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const handleSave = async (publish?: boolean) => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Title required' });
      return;
    }

    if (questions.length === 0) {
      toast({ variant: 'destructive', title: 'Questions required' });
      return;
    }

    for (const q of questions) {
      if (!q.question_text.trim()) {
        toast({ variant: 'destructive', title: 'Incomplete question' });
        return;
      }
    }

    setIsSaving(true);

    try {
      const { error: surveyError } = await supabase
        .from('surveys')
        .update({
          title,
          description,
          is_published: publish !== undefined ? publish : isPublished,
        })
        .eq('id', surveyId);

      if (surveyError) throw surveyError;

      if (deletedQuestionIds.length > 0) {
        await supabase
          .from('survey_questions')
          .delete()
          .in('id', deletedQuestionIds);
      }

      const existingQuestions = questions.filter(q => !q.isNew);
      const newQuestions = questions.filter(q => q.isNew);

      for (const q of existingQuestions) {
        await supabase
          .from('survey_questions')
          .update({
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options.length > 0 ? q.options : null,
            is_required: q.is_required,
            order_index: questions.indexOf(q),
          })
          .eq('id', q.id);
      }

      if (newQuestions.length > 0) {
        const inserts = newQuestions.map((q, i) => ({
          survey_id: surveyId,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options.length > 0 ? q.options : null,
          is_required: q.is_required,
          order_index: existingQuestions.length + i,
        }));

        await supabase.from('survey_questions').insert(inserts);
      }

      toast({
        title: publish ? 'Survey published!' : 'Survey updated!',
        description: publish ? 'Your survey is now live.' : 'Changes saved successfully.',
      });

      navigate('/dashboard/surveys');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error saving survey',
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/surveys')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Survey</h1>
              <p className="text-muted-foreground">Update your survey details and questions</p>
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

        {/* Survey Details */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Survey Details</CardTitle>
            <CardDescription>Basic information about your survey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Survey Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Customer Satisfaction Survey"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide context about the survey..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Questions</h2>
          
          {questions.map((question, index) => {
            const Icon = questionTypeIcons[question.question_type];
            return (
              <Card key={question.id} className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {questionTypeLabels[question.question_type]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        Required
                        <Switch
                          checked={question.is_required}
                          onCheckedChange={(checked) => updateQuestion(question.id, { is_required: checked })}
                        />
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(question.id, question.isNew)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Question {index + 1} *</Label>
                    <Input
                      value={question.question_text}
                      onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                      placeholder="Enter your question..."
                    />
                  </div>

                  {(question.question_type === 'dropdown' || question.question_type === 'checkbox') && (
                    <div className="space-y-3">
                      <Label>Options</Label>
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <div className={cn(
                            "h-4 w-4 rounded border border-muted-foreground/50",
                            question.question_type === 'dropdown' ? 'rounded-full' : ''
                          )} />
                          <Input
                            value={option}
                            onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                            className="flex-1"
                          />
                          {question.options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(question.id, optionIndex)}
                              className="h-8 w-8 text-muted-foreground"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addOption(question.id)}
                        className="text-muted-foreground"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  )}

                  {question.question_type === 'long_text' && (
                    <Textarea disabled placeholder="Respondent's answer will appear here..." rows={3} />
                  )}

                  {question.question_type === 'short_text' && (
                    <Input disabled placeholder="Respondent's answer will appear here..." />
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Add Question Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.entries(questionTypeLabels) as [QuestionType, string][]).map(([type, label]) => {
              const Icon = questionTypeIcons[type];
              return (
                <Button
                  key={type}
                  variant="outline"
                  onClick={() => addQuestion(type)}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SurveyEdit;
