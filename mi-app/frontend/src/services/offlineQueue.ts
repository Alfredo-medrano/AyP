import { getDB } from '../lib/indexeddb';

interface QueueItem {
    id?: number;
    tabla: string;
    operacion: 'INSERT' | 'UPDATE' | 'DELETE';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    datos: Record<string, any>;
    timestamp: string;
    intentos: number;
}

// Add operation to offline queue
export async function addToQueue(item: Omit<QueueItem, 'id' | 'timestamp' | 'intentos'>): Promise<void> {
    const db = await getDB();
    await db.add('offlineQueue', {
        ...item,
        timestamp: new Date().toISOString(),
        intentos: 0,
    });
}

// Get all pending operations
export async function getPendingOperations(): Promise<QueueItem[]> {
    const db = await getDB();
    return db.getAll('offlineQueue');
}

// Remove operation from queue
export async function removeFromQueue(id: number): Promise<void> {
    const db = await getDB();
    await db.delete('offlineQueue', id);
}

// Update retry count
export async function incrementRetryCount(id: number): Promise<void> {
    const db = await getDB();
    const item = await db.get('offlineQueue', id);
    if (item) {
        item.intentos += 1;
        await db.put('offlineQueue', item);
    }
}

// Get operations by table
export async function getOperationsByTable(tabla: string): Promise<QueueItem[]> {
    const db = await getDB();
    return db.getAllFromIndex('offlineQueue', 'by-tabla', tabla);
}

// Clear entire queue
export async function clearQueue(): Promise<void> {
    const db = await getDB();
    await db.clear('offlineQueue');
}

// Get queue length
export async function getQueueLength(): Promise<number> {
    const db = await getDB();
    return db.count('offlineQueue');
}

export default {
    addToQueue,
    getPendingOperations,
    removeFromQueue,
    incrementRetryCount,
    getOperationsByTable,
    clearQueue,
    getQueueLength,
};
