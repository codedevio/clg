import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Crown, AlertTriangle, Loader2, ShieldAlert, ArrowRight } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface OwnershipTransferProps {
  users: User[];
  currentUserId: string;
  onTransferComplete: () => void;
}

const OwnershipTransfer = ({ users, currentUserId, onTransferComplete }: OwnershipTransferProps) => {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [confirmationStep, setConfirmationStep] = useState(0);
  const [confirmText, setConfirmText] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const selectedUser = users.find(u => u.id === selectedUserId);
  const eligibleUsers = users.filter(u => u.id !== currentUserId);

  const handleInitiateTransfer = () => {
    if (!selectedUserId) {
      toast({
        variant: 'destructive',
        title: 'Select a user',
        description: 'Please select a user to transfer ownership to.',
      });
      return;
    }
    setConfirmationStep(1);
  };

  const handleConfirmTransfer = async () => {
    if (confirmText !== 'TRANSFER OWNERSHIP') {
      toast({
        variant: 'destructive',
        title: 'Confirmation required',
        description: 'Please type "TRANSFER OWNERSHIP" to confirm.',
      });
      return;
    }

    setIsTransferring(true);
    try {
      const { data, error } = await supabase.rpc('transfer_superadmin_ownership', {
        _new_owner_id: selectedUserId,
      });

      if (error) throw error;

      toast({
        title: 'Ownership Transferred',
        description: `Successfully transferred Creator ownership to ${selectedUser?.full_name || selectedUser?.email}.`,
      });

      setConfirmationStep(0);
      setSelectedUserId('');
      setConfirmText('');
      onTransferComplete();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: error.message || 'Failed to transfer ownership.',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCancelTransfer = () => {
    setConfirmationStep(0);
    setConfirmText('');
  };

  return (
    <>
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-destructive">
                Transfer Ownership
              </CardTitle>
              <CardDescription>
                Transfer Creator/Superadmin privileges to another user
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  This action is irreversible
                </p>
                <p className="text-muted-foreground mt-1">
                  Transferring ownership will demote you to Admin and give the selected user
                  full Creator/Superadmin privileges. Only the new Creator can reverse this.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="new-owner">Select New Creator</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="new-owner" className="w-full">
                <SelectValue placeholder="Choose a user to transfer ownership to..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex flex-col">
                      <span>{user.full_name || 'No name'}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Badge className="bg-amber-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                You (Creator)
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">
                {selectedUser.full_name || selectedUser.email}
              </Badge>
            </div>
          )}

          <Button
            variant="destructive"
            className="w-full sm:w-auto"
            onClick={handleInitiateTransfer}
            disabled={!selectedUserId}
          >
            <ShieldAlert className="h-4 w-4 mr-2" />
            Initiate Transfer
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmationStep === 1} onOpenChange={(open) => !open && handleCancelTransfer()}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Ownership Transfer
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to transfer Creator/Superadmin ownership to{' '}
                <strong>{selectedUser?.full_name || selectedUser?.email}</strong>.
              </p>
              <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                <p className="font-medium text-destructive">After this transfer:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>You will be demoted to Admin role</li>
                  <li>The new Creator will have full system control</li>
                  <li>Only the new Creator can reverse this action</li>
                </ul>
              </div>
              <div className="space-y-2 pt-2">
                <Label htmlFor="confirm-text" className="text-foreground">
                  Type <strong>TRANSFER OWNERSHIP</strong> to confirm:
                </Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="TRANSFER OWNERSHIP"
                  className="font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelTransfer}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTransfer}
              disabled={confirmText !== 'TRANSFER OWNERSHIP' || isTransferring}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                'Transfer Ownership'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OwnershipTransfer;
