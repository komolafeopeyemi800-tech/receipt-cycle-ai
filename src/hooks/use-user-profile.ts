import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Pick<UserProfile, 'full_name' | 'avatar_url'>>) => {
    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'Please sign in to update your profile',
        variant: 'destructive',
      });
      return { error: new Error('Not signed in') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast({
        title: 'Update failed',
        description: message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) {
      toast({
        title: 'Not signed in',
        description: 'Please sign in to upload an avatar',
        variant: 'destructive',
      });
      return { url: null, error: new Error('Not signed in') };
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      await updateProfile({ avatar_url: publicUrl });

      return { url: publicUrl, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload avatar';
      toast({
        title: 'Upload failed',
        description: message,
        variant: 'destructive',
      });
      return { url: null, error };
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile,
  };
};
