import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import SiteSettingsManager from '@/components/admin/SiteSettingsManager';
import FooterContentManager from '@/components/admin/FooterContentManager';
import OwnershipTransfer from '@/components/admin/OwnershipTransfer';
import AdminReport from '@/components/admin/AdminReport';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  Users,
  FileText,
  ClipboardList,
  Search,
  Loader2,
  Crown,
  ShieldCheck,
  GraduationCap,
  Settings,
  LayoutTemplate,
  ShieldAlert,
  BarChart3,
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

// Role hierarchy: Creator/Superadmin (1) → Admin (many) → Student (many)
const AVAILABLE_ROLES = ['super_admin', 'admin', 'student'] as const;

const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <Crown className="h-3 w-3" />,
  admin: <ShieldCheck className="h-3 w-3" />,
  student: <GraduationCap className="h-3 w-3" />,
};

const roleColors: Record<string, string> = {
  super_admin: 'bg-amber-500 text-white',
  admin: 'bg-primary text-primary-foreground',
  student: 'bg-muted text-muted-foreground',
};

const roleLabels: Record<string, string> = {
  super_admin: 'Creator',
  admin: 'Admin',
  student: 'Student',
};

const SuperAdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
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
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRoles[] = (profilesData || []).map(profile => ({
        ...profile,
        roles: (rolesData || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role),
      }));

      setUsers(usersWithRoles);

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
      <div className="space-y-6 sm:space-y-8 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-500 flex items-center justify-center">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                Super Admin Panel
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage users, roles, and system settings
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 sm:h-28" />)
          ) : (
            statCards.map((stat) => (
              <Card key={stat.label} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-xl sm:text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                    </div>
                    <div className={`h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:flex">
            <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Report</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <LayoutTemplate className="h-4 w-4" />
              <span className="hidden sm:inline">Footer</span>
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-destructive">
              <ShieldAlert className="h-4 w-4" />
              <span className="hidden sm:inline">Transfer</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      User Management
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      View and manage user roles ({users.length} users)
                    </CardDescription>
                  </div>
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="min-w-[600px] sm:min-w-0 px-4 sm:px-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">User</TableHead>
                            <TableHead className="text-xs sm:text-sm">Roles</TableHead>
                            <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Joined</TableHead>
                            <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{user.full_name || 'No name'}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                                    {user.email}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {user.roles.length === 0 ? (
                                    <Badge variant="outline" className="text-xs">No roles</Badge>
                                  ) : (
                                    user.roles
                                      .filter(role => AVAILABLE_ROLES.includes(role as any))
                                      .map(role => (
                                        <Badge
                                          key={role}
                                          className={`text-xs flex items-center gap-1 ${roleColors[role] || ''}`}
                                        >
                                          {roleIcons[role]}
                                          <span className="hidden sm:inline">{roleLabels[role] || role}</span>
                                        </Badge>
                                      ))
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">
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
                                    <SelectTrigger className="w-[100px] sm:w-[140px] text-xs sm:text-sm">
                                      <SelectValue placeholder="Manage" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {/* Only show admin and student options - super_admin cannot be assigned */}
                                      {['admin', 'student'].map(role => (
                                        user.roles.includes(role) ? (
                                          <SelectItem key={`remove:${role}`} value={`remove:${role}`} className="text-xs sm:text-sm">
                                            Remove {roleLabels[role]}
                                          </SelectItem>
                                        ) : (
                                          <SelectItem key={`add:${role}`} value={`add:${role}`} className="text-xs sm:text-sm">
                                            Add {roleLabels[role]}
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
                              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                                No users found matching your search.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <AdminReport />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <SiteSettingsManager />
          </TabsContent>

          {/* Footer Tab */}
          <TabsContent value="footer">
            <FooterContentManager />
          </TabsContent>

          {/* Transfer Ownership Tab */}
          <TabsContent value="transfer">
            <OwnershipTransfer
              users={users}
              currentUserId={user?.id || ''}
              onTransferComplete={() => {
                fetchData();
                // After transfer, user is no longer super_admin, redirect
                navigate('/dashboard');
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminPanel;
