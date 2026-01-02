import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as membersApi from './api';
import type { CreateMemberInput } from './api';

const MEMBERS_KEY = ['members'];

export function useMembers() {
    return useQuery({
        queryKey: MEMBERS_KEY,
        queryFn: membersApi.getMembers,
        staleTime: 1000 * 60 * 5,
    });
}

export function useMember(id: string) {
    return useQuery({
        queryKey: [...MEMBERS_KEY, id],
        queryFn: () => membersApi.getMemberById(id),
        enabled: !!id,
    });
}

export function useMembersBySector(sectorId: number) {
    return useQuery({
        queryKey: [...MEMBERS_KEY, 'sector', sectorId],
        queryFn: () => membersApi.getMembersBySector(sectorId),
        enabled: !!sectorId,
    });
}

export function useCreateMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateMemberInput) => membersApi.createMember(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
        },
    });
}

export function useUpdateMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateMemberInput> }) =>
            membersApi.updateMember(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
        },
    });
}

export function useDeleteMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => membersApi.deleteMember(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
        },
    });
}

// Statistics hook
export function useMembersStats() {
    const { data: members } = useMembers();

    return {
        total: members?.length || 0,
        activos: members?.filter(m => m.status === 'Activo').length || 0,
        inactivos: members?.filter(m => m.status === 'Inactivo').length || 0,
        bautizados: members?.filter(m => m.is_baptized).length || 0,
        byPosition: members?.reduce((acc, m) => {
            acc[m.church_position] = (acc[m.church_position] || 0) + 1;
            return acc;
        }, {} as Record<string, number>) || {},
    };
}
