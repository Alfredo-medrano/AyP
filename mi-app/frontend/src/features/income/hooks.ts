import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as incomeApi from './api';
import type { CreateIncomeInput } from './api';

const INCOME_KEY = ['income'];

export function useIncomes() {
    return useQuery({
        queryKey: INCOME_KEY,
        queryFn: incomeApi.getIncomes,
        staleTime: 1000 * 60 * 5,
    });
}

export function useIncome(id: string) {
    return useQuery({
        queryKey: [...INCOME_KEY, id],
        queryFn: () => incomeApi.getIncomeById(id),
        enabled: !!id,
    });
}

export function useIncomesByDateRange(startDate: string, endDate: string) {
    return useQuery({
        queryKey: [...INCOME_KEY, 'range', startDate, endDate],
        queryFn: () => incomeApi.getIncomesByDateRange(startDate, endDate),
        enabled: !!startDate && !!endDate,
    });
}

export function useCreateIncome() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateIncomeInput) => incomeApi.createIncome(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INCOME_KEY });
        },
    });
}

export function useUpdateIncome() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateIncomeInput> }) =>
            incomeApi.updateIncome(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INCOME_KEY });
        },
    });
}

export function useDeleteIncome() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => incomeApi.deleteIncome(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: INCOME_KEY });
        },
    });
}

// Statistics hook
export function useIncomeStats() {
    const { data: incomes } = useIncomes();

    const total = incomes?.reduce((acc, i) => acc + i.amount, 0) || 0;

    const byCategory = incomes?.reduce((acc, i) => {
        acc[i.category] = (acc[i.category] || 0) + i.amount;
        return acc;
    }, {} as Record<string, number>) || {};

    return {
        total,
        count: incomes?.length || 0,
        byCategory,
        diezmos: byCategory['Diezmo'] || 0,
        ofrendas: (byCategory['Ofrenda General'] || 0) + (byCategory['Ofrenda Especial'] || 0),
        proTemplo: byCategory['Pro-templo'] || 0,
    };
}
