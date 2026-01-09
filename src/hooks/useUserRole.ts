import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Role hierarchy: super_admin (Creator) → admin → student
type AppRole = 'super_admin' | 'admin' | 'student';

export const useUserRole = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) throw error;
        setRoles((data || []).map(r => r.role as AppRole));
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

  // super_admin is the Creator/Superadmin (top-level, only one exists)
  const isSuperAdmin = roles.includes('super_admin');
  // Admins have admin role OR are super_admin (hierarchy)
  const isAdmin = roles.includes('admin') || isSuperAdmin;
  // Creator is now super_admin (backward compatibility)
  const isCreator = isSuperAdmin;
  // Check if user is a student
  const isStudent = roles.includes('student');

  return { roles, loading, isSuperAdmin, isAdmin, isCreator, isStudent };
};
