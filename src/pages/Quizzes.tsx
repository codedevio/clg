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
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  BarChart3,
  Clock,
  Users,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  time_limit_minutes: number;
  total_marks: number;
  created_at: string;
  _count?: {
    attempts: number;
    questions: number;
  };
}

const Quizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, [user]);

  const fetchQuizzes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('creator_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch counts for each quiz
      const quizzesWithCounts = await Promise.all(
        data.map(async (quiz) => {
          const [attemptsRes, questionsRes] = await Promise.all([
            supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('quiz_id', quiz.id),
            supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).eq('quiz_id', quiz.id).eq('is_archived', false),
          ]);
          
          return {
            ...quiz,
            _count: {
              attempts: attemptsRes.count || 0,
              questions: questionsRes.count || 0,
            },
          };
        })
      );

      setQuizzes(quizzesWithCounts);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading quizzes',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (quizId: string) => {
    const link = `${window.location.origin}/quiz/${quizId}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copied!', description: 'Quiz link copied to clipboard.' });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('id', deleteId);
      if (error) throw error;
      
      setQuizzes(quizzes.filter(q => q.id !== deleteId));
      toast({ title: 'Quiz archived', description: 'Quiz has been archived. All results and history are preserved.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setDeleteId(null);
    }
  };

  const handlePublishToggle = async (quizId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_published: !currentStatus })
        .eq('id', quizId);

      if (error) throw error;

      setQuizzes(quizzes.map(q => 
        q.id === quizId ? { ...q, is_published: !currentStatus } : q
      ));
      
      toast({
        title: currentStatus ? 'Quiz unpublished' : 'Quiz published',
        description: currentStatus ? 'Quiz is now a draft.' : 'Quiz is now live!',
      });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quizzes</h1>
            <p className="text-muted-foreground mt-1">Create and manage your quizzes</p>
          </div>
          <Button asChild>
            <Link to="/dashboard/quizzes/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search quizzes..." 
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
        ) : filteredQuizzes.length === 0 ? (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl mb-2">
                {searchQuery ? 'No quizzes found' : 'No quizzes yet'}
              </CardTitle>
              <CardDescription className="max-w-sm mb-6">
                {searchQuery 
                  ? 'Try adjusting your search query.'
                  : 'Create your first quiz to start assessing your students with secure, proctored examinations.'}
              </CardDescription>
              {!searchQuery && (
                <Button asChild>
                  <Link to="/dashboard/quizzes/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Quiz
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredQuizzes.map((quiz) => (
              <Card key={quiz.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">{quiz.title}</h3>
                        <Badge variant={quiz.is_published ? 'default' : 'secondary'}>
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      {quiz.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-1">
                          {quiz.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {quiz._count?.questions || 0} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {quiz.time_limit_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {quiz._count?.attempts || 0} attempts
                        </span>
                        <span>
                          Created {format(new Date(quiz.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/quizzes/${quiz.id}/results`)}
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
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/quizzes/${quiz.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(quiz.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                          {quiz.is_published && (
                            <DropdownMenuItem onClick={() => window.open(`/quiz/${quiz.id}`, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open Quiz
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handlePublishToggle(quiz.id, quiz.is_published)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {quiz.is_published ? 'Unpublish' : 'Publish'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(quiz.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Archive
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
            <AlertDialogTitle>Archive Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the quiz and hide it from your list. All past results, attempts, and history will be preserved and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Quizzes;
