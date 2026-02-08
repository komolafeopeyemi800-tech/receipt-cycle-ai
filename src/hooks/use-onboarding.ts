import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OnboardingData {
  currency: string;
  goals: string[];
  trackingMode: string;
  usecases: string[];
  country: string;
  industry: string;
  completed: boolean;
  completedAt?: string;
}

export const useOnboarding = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    currency: '',
    goals: [],
    trackingMode: '',
    usecases: [],
    country: '',
    industry: '',
    completed: false,
  });

  // Load from localStorage initially
  useEffect(() => {
    const stored = localStorage.getItem('onboardingData');
    if (stored) {
      try {
        setOnboardingData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse onboarding data:', e);
      }
    }
  }, []);

  const saveOnboardingData = async (data: OnboardingData) => {
    // Always save to localStorage first
    localStorage.setItem('onboardingData', JSON.stringify(data));
    setOnboardingData(data);

    // If user is authenticated, also save to their profile
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({
            currency: data.currency || 'USD',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Failed to update profile with onboarding data:', error);
        }
      }
    } catch (error) {
      console.error('Error saving onboarding data to profile:', error);
    }
  };

  const syncOnboardingToProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return false;
      }

      const stored = localStorage.getItem('onboardingData');
      if (!stored) {
        return false;
      }

      const data: OnboardingData = JSON.parse(stored);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          currency: data.currency || 'USD',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to sync onboarding to profile:', error);
        toast({
          title: 'Sync failed',
          description: 'Could not save your preferences',
          variant: 'destructive',
        });
        return false;
      }

      toast({
        title: 'Preferences saved!',
        description: 'Your settings have been applied to your account',
      });
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearOnboardingData = () => {
    localStorage.removeItem('onboardingData');
    setOnboardingData({
      currency: '',
      goals: [],
      trackingMode: '',
      usecases: [],
      country: '',
      industry: '',
      completed: false,
    });
  };

  return {
    onboardingData,
    isLoading,
    saveOnboardingData,
    syncOnboardingToProfile,
    clearOnboardingData,
  };
};
