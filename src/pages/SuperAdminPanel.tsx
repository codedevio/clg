import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import {
  Shield,
  Users,
  FileText,
  ClipboardList,
  Search,
  UserPlus,
  Loader2,
  Crown,
  ShieldCheck,
  User,
  GraduationCap,
} from 'lucide-react';
import { format } from 'date-fns';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

interface SystemStats {
  totalUsers: number;
  totalQuizzes: number;
  totalSurveys: number;
  totalAttempts: number;
  totalSurveyResponses: number;
}

const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <Crown className="h-3 w-3" />,
  admin: <ShieldCheck className="h-3 w-3" />,
  creator: <User className="h-3 w-3" />,
  student: <GraduationCap className="h-3 w-3" />,
};

const roleColors: Record<string, string> = {
  super_admin: 'bg-amber-500 text-white',
  admin: 'bg-primary text-primary-foreground',
  creator: 'bg-accent text-accent-foreground',
  student: 'bg-muted text-muted-foreground',
};

const SuperAdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalQuizzes: 0,
    totalSurveys: 0,
    totalAttempts: 0,
    totalSurveyResponses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && !isSuperAdmin) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to access this page.',
      });
      navigate('/dashboard');
    }
  }, [roleLoading, isSuperAdmin, navigate, toast]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const fetchData = async () => {
    try {
      // Fetch profiles with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Map roles to users
      const usersWithRoles: UserWithRoles[] = (profilesData || []).map(profile => ({
        ...profile,
        roles: (rolesData || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role),
      }));

      setUsers(usersWithRoles);

      // Fetch system stats
      const [quizCount, surveyCount, attemptCount, responseCount] = await Promise.all([
        supabase.from('quizzes').select('id', { count: 'exact', head: true }),
        supabase.from('surveys').select('id', { count: 'exact', head: true }),
        supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }),
        supabase.from('survey_responses').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersWithRoles.length,
        totalQuizzes: quizCount.count || 0,
        totalSurveys: surveyCount.count || 0,
        totalAttempts: attemptCount.count || 0,
        totalSurveyResponses: responseCount.count || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string, action: 'add' | 'remove') => {
    setUpdatingRole(userId);
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole as any });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', newRole as any);
        if (error) throw error;
      }

      toast({
        title: 'Role Updated',
        description: `Successfully ${action === 'add' ? 'added' : 'removed'} ${newRole} role.`,
      });
      
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update role.',
      });
    } finally {
      setUpdatingRole(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (roleLoading || (!isSuperAdmin && !roleLoading)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-primary' },
    { label: 'Total Quizzes', value: stats.totalQuizzes, icon: FileText, color: 'bg-accent' },
    { label: 'Total Surveys', value: stats.totalSurveys, icon: ClipboardList, color: 'bg-amber-500' },
    { label: 'Quiz Attempts', value: stats.totalAttempts, icon: GraduationCap, color: 'bg-emerald-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Super Admin Panel
              </h1>
              <p className="text-muted-foreground">
                Manage users, roles, and view system statistics
              </p>
            </div>
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
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* User Management */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Management
                </CardTitle>
                <CardDescription>
                  View and manage user roles ({users.length} users)
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Current Roles</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {user.roles.length === 0 ? (
                              <Badge variant="outline" className="text-xs">No roles</Badge>
                            ) : (
                              user.roles.map(role => (
                                <Badge
                                  key={role}
                                  className={`text-xs flex items-center gap-1 ${roleColors[role] || ''}`}
                                >
                                  {roleIcons[role]}
                                  {role.replace('_', ' ')}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              disabled={updatingRole === user.id}
                              onValueChange={(value) => {
                                const [action, role] = value.split(':');
                                handleRoleChange(user.id, role, action as 'add' | 'remove');
                              }}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Manage roles" />
                              </SelectTrigger>
                              <SelectContent>
                                {['super_admin', 'admin', 'creator', 'student'].map(role => (
                                  user.roles.includes(role) ? (
                                    <SelectItem key={`remove:${role}`} value={`remove:${role}`}>
                                      Remove {role.replace('_', ' ')}
                                    </SelectItem>
                                  ) : (
                                    <SelectItem key={`add:${role}`} value={`add:${role}`}>
                                      Add {role.replace('_', ' ')}
                                    </SelectItem>
                                  )
                                ))}
                              </SelectContent>
                            </Select>
                            {updatingRole === user.id && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No users found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminPanel;
