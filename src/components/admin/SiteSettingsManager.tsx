import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Loader2 } from 'lucide-react';

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface SiteSettingDB {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

const SiteSettingsManager = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('id, key, value, description')
        .order('key');

      if (error) throw error;
      
      const mappedSettings: SiteSetting[] = (data || []).map(item => ({
        id: item.id,
        key: item.key,
        value: String(item.value),
        description: item.description,
      }));
      
      setSettings(mappedSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (setting: SiteSetting) => {
    setSaving(setting.key);
    const newValue = setting.value === 'true' ? 'false' : 'true';
    
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq('id', setting.id);

      if (error) throw error;

      setSettings(prev => 
        prev.map(s => s.id === setting.id ? { ...s, value: newValue } : s)
      );

      toast({
        title: 'Setting Updated',
        description: `${setting.key.replace(/_/g, ' ')} has been ${newValue === 'true' ? 'enabled' : 'disabled'}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update setting.',
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">Site Settings</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Configure global platform settings</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
        {settings.map((setting) => (
          <div 
            key={setting.id} 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg"
          >
            <div className="min-w-0 flex-1">
              <Label className="font-medium capitalize text-sm sm:text-base">
                {setting.key.replace(/_/g, ' ')}
              </Label>
              {setting.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{setting.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              {saving === setting.key && <Loader2 className="h-4 w-4 animate-spin" />}
              <Switch
                checked={setting.value === 'true'}
                onCheckedChange={() => handleToggle(setting)}
                disabled={saving === setting.key}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SiteSettingsManager;
