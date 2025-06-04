import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: any, user: any }>;
  signOut: () => Promise<void>;
  updateUserStatus: (isOnline: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode, externalSession?: any, externalUser?: any }> = ({ children, externalSession, externalUser }) => {
  // Usar el usuario global de la app principal si está disponible
  const globalUser = useAuthStore.getState().user;
  const [session, setSession] = useState<Session | null>(externalSession ?? null);

  // Adaptar el usuario global al tipo User de Supabase si existe
  const adaptUserToSupabase = (globalUser: any): User => ({
    id: globalUser.id,
    email: globalUser.email,
    user_metadata: {
      username: globalUser.username,
      displayName: globalUser.displayName,
      avatar: globalUser.avatar,
      cover_image: globalUser.cover_image,
      bio: globalUser.bio,
      website: globalUser.website,
      disciplines: globalUser.disciplines,
      social_links: globalUser.social_links
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '',
    // ...otros campos requeridos por User de Supabase...
  } as User);

  const [user, setUser] = useState<User | null>(externalUser ?? (globalUser ? adaptUserToSupabase(globalUser) : null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (externalSession && externalUser) {
      setSession(externalSession);
      setUser(externalUser);
      setLoading(false);
      return;
    }
    if (globalUser) {
      setUser(adaptUserToSupabase(globalUser));
      setLoading(false);
      return;
    }

    // Set up initial session and user
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const session = data.session;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        updateUserStatus(true);
      }
      setLoading(false);
    });

    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: any, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Set up online status handling
    const handleVisibilityChange = () => {
      if (user && document.visibilityState === 'visible') {
        updateUserStatus(true);
      } else if (user && document.visibilityState === 'hidden') {
        updateUserStatus(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up window close/unload handling
    const handleBeforeUnload = () => {
      if (user) {
        updateUserStatus(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (user) {
        updateUserStatus(false);
      }
    };
  }, [externalSession, externalUser, globalUser]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      updateUserStatus(true);
    }
    return { error };
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { error, user: null };
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username,
          full_name: fullName,
          last_online: new Date().toISOString()
        });

      if (profileError) {
        return { error: profileError, user: null };
      }
    }

    return { error: null, user: data.user };
  };

  const signOut = async () => {
    await updateUserStatus(false);
    await supabase.auth.signOut();
  };

  const updateUserStatus = async (isOnline: boolean) => {
    if (!user) return;

    await supabase
      .from('profiles')
      .update({
        last_online: isOnline ? new Date().toISOString() : new Date().toISOString()
      })
      .eq('id', user.id);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut, updateUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};