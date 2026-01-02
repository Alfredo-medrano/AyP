import { supabase } from '../../lib/supabase';
import { saveToLocal, getAllFromLocal } from '../../lib/indexeddb';
import type { Sector } from '../../types/database';

export async function getSectors(): Promise<Sector[]> {
    // Try cache first
    const cached = await getAllFromLocal<Sector>('sectors');

    if (!navigator.onLine) {
        return cached;
    }

    const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;

    // Cache locally
    if (data) {
        for (const sector of data) {
            await saveToLocal('sectors', sector);
        }
    }

    return (data || []) as Sector[];
}

export async function getSectorById(id: number): Promise<Sector | null> {
    const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Sector;
}

export default {
    getSectors,
    getSectorById,
};
