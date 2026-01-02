import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as authApi from './api';

export function useCurrentUser() {
    return useQuery({
        queryKey: ['auth', 'user'],
        queryFn: authApi.getCurrentUser,
        staleTime: Infinity,
    });
}

export function useSignIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authApi.signIn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auth'] });
        },
    });
}

export function useSignUp() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authApi.signUp,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auth'] });
        },
    });
}

export function useSignOut() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: authApi.signOut,
        onSuccess: () => {
            queryClient.clear();
        },
    });
}

export function useResetPassword() {
    return useMutation({
        mutationFn: authApi.resetPassword,
    });
}

export function useUpdatePassword() {
    return useMutation({
        mutationFn: authApi.updatePassword,
    });
}

export default {
    useCurrentUser,
    useSignIn,
    useSignUp,
    useSignOut,
    useResetPassword,
    useUpdatePassword,
};
