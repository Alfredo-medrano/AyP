import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as expensesApi from './api';
import type { CreateExpenseInput } from './api';

const EXPENSES_KEY = ['expenses'];

export function useExpenses() {
    return useQuery({
        queryKey: EXPENSES_KEY,
        queryFn: expensesApi.getExpenses,
        staleTime: 1000 * 60 * 5,
    });
}

export function useExpense(id: string) {
    return useQuery({
        queryKey: [...EXPENSES_KEY, id],
        queryFn: () => expensesApi.getExpenseById(id),
        enabled: !!id,
    });
}

export function useExpensesByDateRange(startDate: string, endDate: string) {
    return useQuery({
        queryKey: [...EXPENSES_KEY, 'range', startDate, endDate],
        queryFn: () => expensesApi.getExpensesByDateRange(startDate, endDate),
        enabled: !!startDate && !!endDate,
    });
}

export function useCreateExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateExpenseInput) => expensesApi.createExpense(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
        },
    });
}

export function useUpdateExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateExpenseInput> }) =>
            expensesApi.updateExpense(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
        },
    });
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => expensesApi.deleteExpense(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
        },
    });
}

export function useUploadReceipt() {
    return useMutation({
        mutationFn: (file: File) => expensesApi.uploadReceipt(file),
    });
}

// Statistics hook
export function useExpensesStats() {
    const { data: expenses } = useExpenses();

    const total = expenses?.reduce((acc, e) => acc + e.amount, 0) || 0;

    const byCategory = expenses?.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
    }, {} as Record<string, number>) || {};

    const byFundingSource = expenses?.reduce((acc, e) => {
        if (e.funding_source) {
            acc[e.funding_source] = (acc[e.funding_source] || 0) + e.amount;
        }
        return acc;
    }, {} as Record<string, number>) || {};

    return {
        total,
        count: expenses?.length || 0,
        byCategory,
        byFundingSource,
    };
}

