import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ClipboardList,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  BarChart3,
  MessageSquare,
  Users,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

interface Survey {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  _count?: {
    responses: number;
    questions: number;
  };
}

const Surveys = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchSurveys();
  }, [user]);

  const fetchSurveys = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const surveysWithCounts = await Promise.all(
        data.map(async (survey) => {
          const [responsesRes, questionsRes] = await Promise.all([
            supabase.from('survey_responses').select('id', { count: 'exact', head: true }).eq('survey_id', survey.id),
            supabase.from('survey_questions').select('id', { count: 'exact', head: true }).eq('survey_id', survey.id),
          ]);
          
          return {
            ...survey,
            _count: {
              responses: responsesRes.count || 0,
              questions: questionsRes.count || 0,
            },
          };
        })
      );

      setSurveys(surveysWithCounts);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading surveys',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (surveyId: string) => {
    const link = `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copied!', description: 'Survey link copied to clipboard.' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase.from('surveys').delete().eq('id', deleteId);
      if (error) throw error;
      
      setSurveys(surveys.filter(s => s.id !== deleteId));
      toast({ title: 'Survey deleted', description: 'Survey has been permanently deleted.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setDeleteId(null);
    }
  };

  const handlePublishToggle = async (surveyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ is_published: !currentStatus })
        .eq('id', surveyId);

      if (error) throw error;

      setSurveys(surveys.map(s => 
        s.id === surveyId ? { ...s, is_published: !currentStatus } : s
      ));
      
      toast({
        title: currentStatus ? 'Survey unpublished' : 'Survey published',
        description: currentStatus ? 'Survey is now a draft.' : 'Survey is now live!',
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const filteredSurveys = surveys.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Surveys</h1>
            <p className="text-muted-foreground mt-1">Create and manage your surveys</p>
          </div>
          <Button asChild>
            <Link to="/dashboard/surveys/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Survey
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search surveys..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : filteredSurveys.length === 0 ? (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <ClipboardList className="h-10 w-10 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl mb-2">
                {searchQuery ? 'No surveys found' : 'No surveys yet'}
              </CardTitle>
              <CardDescription className="max-w-sm mb-6">
                {searchQuery 
                  ? 'Try adjusting your search query.'
                  : 'Create your first survey to gather feedback and insights from your audience.'}
              </CardDescription>
              {!searchQuery && (
                <Button asChild>
                  <Link to="/dashboard/surveys/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Survey
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSurveys.map((survey) => (
              <Card key={survey.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">{survey.title}</h3>
                        <Badge variant={survey.is_published ? 'default' : 'secondary'}>
                          {survey.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      {survey.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-1">
                          {survey.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {survey._count?.questions || 0} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {survey._count?.responses || 0} responses
                        </span>
                        <span>
                          Created {format(new Date(survey.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/surveys/${survey.id}/results`)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Results
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/surveys/${survey.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(survey.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                          {survey.is_published && (
                            <DropdownMenuItem onClick={() => window.open(`/survey/${survey.id}`, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Survey
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handlePublishToggle(survey.id, survey.is_published)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {survey.is_published ? 'Unpublish' : 'Publish'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(survey.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Survey?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the survey and all associated data including questions and responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Surveys;
