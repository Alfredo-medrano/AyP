import { supabase } from '../../lib/supabase';

export interface SignInCredentials {
    email: string;
    password: string;
}

export interface SignUpCredentials extends SignInCredentials {
    nombre?: string;
}

export async function signIn({ email, password }: SignInCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

export async function signUp({ email, password, nombre }: SignUpCredentials) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { nombre },
        },
    });

    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}

export async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
}

export async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });
    if (error) throw error;
}

export default {
    signIn,
    signUp,
    signOut,
    getCurrentUser,
    resetPassword,
    updatePassword,
};
