import { supabase } from '../../lib/supabase';
import { saveToLocal, getAllFromLocal } from '../../lib/indexeddb';
import { addToQueue } from '../../services/offlineQueue';
import type { Expense, ExpenseCategory, IncomeCategory } from '../../types/database';

export interface CreateExpenseInput {
    amount: number;
    date: string;
    category: ExpenseCategory;
    description: string;
    funding_source: IncomeCategory;
    receipt_url?: string;
}

export async function getExpenses(): Promise<Expense[]> {
    if (!navigator.onLine) {
        return getAllFromLocal<Expense>('expenses');
    }

    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .is('deleted_at', null)
        .order('date', { ascending: false });

    if (error) throw error;

    if (data) {
        for (const expense of data) {
            if (expense) {
                await saveToLocal('expenses', { ...(expense as Expense), sincronizado: true });
            }
        }
    }

    return (data || []) as Expense[];
}

export async function getExpenseById(id: string): Promise<Expense | null> {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Expense;
}

export async function getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .is('deleted_at', null)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as Expense[];
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
    const expense = {
        ...input,
        id: crypto.randomUUID(),
    };

    if (!navigator.onLine) {
        const localExpense: Expense = {
            ...expense,
            receipt_url: input.receipt_url || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: null,
            deleted_at: null,
        };
        await saveToLocal('expenses', { ...localExpense, sincronizado: false });
        await addToQueue({
            tabla: 'expenses',
            operacion: 'INSERT',
            datos: expense,
        });
        return localExpense;
    }

    const { data, error } = await supabase
        .from('expenses')
        .insert(expense as never)
        .select()
        .single();

    if (error) throw error;

    const savedExpense = data as Expense;
    await saveToLocal('expenses', { ...savedExpense, sincronizado: true });
    return savedExpense;
}

export async function updateExpense(id: string, updates: Partial<CreateExpenseInput>): Promise<Expense> {
    const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
    };

    if (!navigator.onLine) {
        await addToQueue({
            tabla: 'expenses',
            operacion: 'UPDATE',
            datos: { id, ...updateData },
        });
    }

    const { data, error } = await supabase
        .from('expenses')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;

    const savedExpense = data as Expense;
    await saveToLocal('expenses', { ...savedExpense, sincronizado: true });
    return savedExpense;
}

export async function deleteExpense(id: string): Promise<void> {
    // Soft delete
    const { error } = await supabase
        .from('expenses')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id);

    if (error) throw error;
}

export async function uploadReceipt(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
    return data.publicUrl;
}

export default {
    getExpenses,
    getExpenseById,
    getExpensesByDateRange,
    createExpense,
    updateExpense,
    deleteExpense,
    uploadReceipt,
};
