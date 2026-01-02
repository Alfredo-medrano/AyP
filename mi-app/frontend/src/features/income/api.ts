import { supabase } from '../../lib/supabase';
import { saveToLocal, getAllFromLocal } from '../../lib/indexeddb';
import { addToQueue } from '../../services/offlineQueue';
import type { Income, IncomeCategory } from '../../types/database';

export interface CreateIncomeInput {
    amount: number;
    date: string;
    category: IncomeCategory;
    period?: string;
    member_id?: string;
    sector_id?: number;
    notes?: string;
}

export async function getIncomes(): Promise<Income[]> {
    if (!navigator.onLine) {
        return getAllFromLocal<Income>('income');
    }

    const { data, error } = await supabase
        .from('income')
        .select('*, member:members(id, full_name), sector:sectors(*)')
        .is('deleted_at', null)
        .order('date', { ascending: false });

    if (error) throw error;

    if (data) {
        for (const income of data) {
            if (income) {
                await saveToLocal('income', { ...(income as Income), sincronizado: true });
            }
        }
    }

    return (data || []) as Income[];
}

export async function getIncomeById(id: string): Promise<Income | null> {
    const { data, error } = await supabase
        .from('income')
        .select('*, member:members(id, full_name), sector:sectors(*)')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Income;
}

export async function getIncomesByDateRange(startDate: string, endDate: string): Promise<Income[]> {
    const { data, error } = await supabase
        .from('income')
        .select('*, member:members(id, full_name), sector:sectors(*)')
        .is('deleted_at', null)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as Income[];
}

export async function createIncome(input: CreateIncomeInput): Promise<Income> {
    const income = {
        ...input,
        id: crypto.randomUUID(),
    };

    if (!navigator.onLine) {
        const localIncome: Income = {
            ...income,
            period: input.period || null,
            member_id: input.member_id || null,
            sector_id: input.sector_id || null,
            notes: input.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: null,
            deleted_at: null,
        };
        await saveToLocal('income', { ...localIncome, sincronizado: false });
        await addToQueue({
            tabla: 'income',
            operacion: 'INSERT',
            datos: income,
        });
        return localIncome;
    }

    const { data, error } = await supabase
        .from('income')
        .insert(income as never)
        .select('*, member:members(id, full_name), sector:sectors(*)')
        .single();

    if (error) throw error;

    const savedIncome = data as Income;
    await saveToLocal('income', { ...savedIncome, sincronizado: true });
    return savedIncome;
}

export async function updateIncome(id: string, updates: Partial<CreateIncomeInput>): Promise<Income> {
    const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
    };

    if (!navigator.onLine) {
        await addToQueue({
            tabla: 'income',
            operacion: 'UPDATE',
            datos: { id, ...updateData },
        });
    }

    const { data, error } = await supabase
        .from('income')
        .update(updateData as never)
        .eq('id', id)
        .select('*, member:members(id, full_name), sector:sectors(*)')
        .single();

    if (error) throw error;

    const savedIncome = data as Income;
    await saveToLocal('income', { ...savedIncome, sincronizado: true });
    return savedIncome;
}

export async function deleteIncome(id: string): Promise<void> {
    // Soft delete
    const { error } = await supabase
        .from('income')
        .update({ deleted_at: new Date().toISOString() } as never)
        .eq('id', id);

    if (error) throw error;
}

export default {
    getIncomes,
    getIncomeById,
    getIncomesByDateRange,
    createIncome,
    updateIncome,
    deleteIncome,
};
