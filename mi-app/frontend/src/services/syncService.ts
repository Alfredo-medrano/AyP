import { supabase } from '../lib/supabase';
import {
    getPendingOperations,
    removeFromQueue,
    incrementRetryCount
} from './offlineQueue';
import { getAllFromLocal, saveToLocal } from '../lib/indexeddb';

const MAX_RETRIES = 5;

interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
}

// Process a single queue item
async function processQueueItem(item: {
    id?: number;
    tabla: string;
    operacion: 'INSERT' | 'UPDATE' | 'DELETE';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    datos: any;
    intentos: number;
}): Promise<boolean> {
    try {
        const { tabla, operacion, datos } = item;

        switch (operacion) {
            case 'INSERT': {
                const { error } = await supabase.from(tabla).insert(datos as never);
                if (error) throw error;
                break;
            }
            case 'UPDATE': {
                const { id, ...rest } = datos;
                const { error } = await supabase.from(tabla).update(rest as never).eq('id', id);
                if (error) throw error;
                break;
            }
            case 'DELETE': {
                const { error } = await supabase.from(tabla).delete().eq('id', datos.id);
                if (error) throw error;
                break;
            }
        }

        return true;
    } catch (error) {
        console.error('Error processing queue item:', error);
        return false;
    }
}

// Main sync function
export async function syncWithServer(): Promise<SyncResult> {
    const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
    };

    // Check if online
    if (!navigator.onLine) {
        result.success = false;
        result.errors.push('No internet connection');
        return result;
    }

    const pendingOperations = await getPendingOperations();

    for (const item of pendingOperations) {
        if (item.intentos >= MAX_RETRIES) {
            result.failed += 1;
            result.errors.push(`Max retries exceeded for operation on ${item.tabla}`);
            continue;
        }

        const success = await processQueueItem(item);

        if (success) {
            if (item.id !== undefined) {
                await removeFromQueue(item.id);
            }
            result.synced += 1;
        } else {
            if (item.id !== undefined) {
                await incrementRetryCount(item.id);
            }
            result.failed += 1;
        }
    }

    if (result.failed > 0) {
        result.success = false;
    }

    return result;
}

type SyncableTable = 'members' | 'income' | 'expenses' | 'sectors';

// Sync local data from server
export async function syncFromServer(tabla: SyncableTable): Promise<void> {
    if (!navigator.onLine) return;

    try {
        const { data, error } = await supabase.from(tabla).select('*');

        if (error) throw error;

        if (data) {
            for (const item of data) {
                if (item && typeof item === 'object') {
                    await saveToLocal(tabla, { ...(item as Record<string, unknown>), sincronizado: true });
                }
            }
        }
    } catch (error) {
        console.error(`Error syncing ${tabla} from server:`, error);
    }
}

// Get data with offline fallback
export async function getDataWithFallback<T>(
    tabla: SyncableTable,
    query: () => Promise<{ data: T[] | null; error: Error | null }>
): Promise<T[]> {
    if (navigator.onLine) {
        try {
            const { data, error } = await query();
            if (error) throw error;
            return data || [];
        } catch {
            // Fall back to local data
            return getAllFromLocal<T>(tabla);
        }
    }

    return getAllFromLocal<T>(tabla);
}

// Auto-sync when coming online
export function setupAutoSync(): () => void {
    const handleOnline = () => {
        console.log('Back online, syncing...');
        syncWithServer();
    };

    window.addEventListener('online', handleOnline);

    return () => {
        window.removeEventListener('online', handleOnline);
    };
}

export default {
    syncWithServer,
    syncFromServer,
    getDataWithFallback,
    setupAutoSync,
};
