import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    error: Error | null;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        // If Supabase is not configured, just stop loading
        if (!isSupabaseConfigured) {
            setAuthState(prev => ({ ...prev, loading: false }));
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                setAuthState(prev => ({ ...prev, error, loading: false }));
            } else {
                setAuthState({
                    user: session?.user ?? null,
                    session,
                    loading: false,
                    error: null,
                });
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setAuthState({
                    user: session?.user ?? null,
                    session,
                    loading: false,
                    error: null,
                });
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        if (!isSupabaseConfigured) {
            return { error: new Error('Supabase not configured') };
        }
        setAuthState(prev => ({ ...prev, loading: true, error: null }));
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            setAuthState(prev => ({ ...prev, error, loading: false }));
            return { error };
        }
        return { data };
    }, []);

    const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
        if (!isSupabaseConfigured) {
            return { error: new Error('Supabase not configured') };
        }
        setAuthState(prev => ({ ...prev, loading: true, error: null }));
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });
        if (error) {
            setAuthState(prev => ({ ...prev, error, loading: false }));
            return { error };
        }
        return { data };
    }, []);

    const signOut = useCallback(async () => {
        if (!isSupabaseConfigured) {
            return { error: new Error('Supabase not configured') };
        }
        setAuthState(prev => ({ ...prev, loading: true }));
        const { error } = await supabase.auth.signOut();
        if (error) {
            setAuthState(prev => ({ ...prev, error, loading: false }));
            return { error };
        }
        return {};
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        if (!isSupabaseConfigured) {
            return { error: new Error('Supabase not configured') };
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        return { error };
    }, []);

    return {
        ...authState,
        signIn,
        signUp,
        signOut,
        resetPassword,
        isAuthenticated: !!authState.user,
        isConfigured: isSupabaseConfigured,
    };
}

export default useAuth;
