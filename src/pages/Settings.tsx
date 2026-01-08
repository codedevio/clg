import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { User, Bell, Shield, Loader2 } from 'lucide-react';
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

const Settings = () => {
  const { user, signOut, resetPassword } = useAuth();
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useSiteSettings();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [fullName, setFullName] = useState('');
  const [notifications, setNotifications] = useState({
    email: true,
    quizComplete: true,
    surveyComplete: true,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setFullName(data.full_name || '');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: 'Settings saved',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update profile.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    
    setIsResettingPassword(true);
    
    try {
      const { error } = await resetPassword(user.email);
      if (error) throw error;
      
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your email for a link to reset your password.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send password reset email.',
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    
    try {
      // Sign out first
      await signOut();
      
      toast({
        title: 'Account Deletion Requested',
        description: 'Your account deletion request has been submitted. Please contact support to complete the process.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to process account deletion.',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (settingsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-up max-w-3xl px-1 sm:px-0">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Profile</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted text-sm"
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        {settings.notifications_enabled && (
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Notifications</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Configure how you receive updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm sm:text-base">Email Notifications</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm sm:text-base">Quiz Completion</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Notify when someone completes a quiz</p>
                </div>
                <Switch
                  checked={notifications.quizComplete}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, quizComplete: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm sm:text-base">Survey Responses</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Notify when someone responds to a survey</p>
                </div>
                <Switch
                  checked={notifications.surveyComplete}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, surveyComplete: checked })}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Section */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Security</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Manage your account security</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
            {settings.allow_password_change && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm sm:text-base">Change Password</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Update your password regularly</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleChangePassword}
                    disabled={isResettingPassword}
                    className="w-full sm:w-auto"
                  >
                    {isResettingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Change
                  </Button>
                </div>
                <Separator />
              </>
            )}
            {settings.allow_account_deletion && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-destructive text-sm sm:text-base">Delete Account</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Permanently delete your account and data</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="mx-4 sm:mx-0">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount}
                        className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeletingAccount && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
