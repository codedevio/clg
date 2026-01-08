import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  notifications_enabled: boolean;
  allow_password_change: boolean;
  allow_account_deletion: boolean;
}

const defaultSettings: SiteSettings = {
  notifications_enabled: true,
  allow_password_change: true,
  allow_account_deletion: true,
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      if (data) {
        const settingsObj = data.reduce((acc, item) => {
          acc[item.key as keyof SiteSettings] = item.value === 'true' || item.value === true;
          return acc;
        }, {} as SiteSettings);
        
        setSettings({ ...defaultSettings, ...settingsObj });
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refetch: fetchSettings };
};
