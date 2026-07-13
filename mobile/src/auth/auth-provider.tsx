import { getMe } from '@/src/api/endpoints';
import { ApiError } from '@/src/api/client';
import { supabase } from './supabase';
import type { Me } from '@/src/types/api';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

type AuthContextValue = {
  session: Session | null;
  profile: Me | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (activeSession: Session | null) => {
    if (!activeSession) {
      setProfile(null);
      setError(null);
      return;
    }

    try {
      setProfile(await getMe());
      setError(null);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
      }
      setError(loadError instanceof Error ? loadError.message : 'Could not load your profile');
    }
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.startAutoRefresh();

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (active) setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      void loadProfile(nextSession);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
      supabase.auth.stopAutoRefresh();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      isLoading,
      error,
      refreshProfile: () => loadProfile(session),
      signOut: async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
      }
    }),
    [error, isLoading, loadProfile, profile, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
