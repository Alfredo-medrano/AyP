import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'iglesia-app-db';
const DB_VERSION = 1;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbInstance: IDBPDatabase<any> | null = null;

// Types for local storage
export interface MemberLocal {
    id: string;
    full_name: string;
    dui: string | null;
    phone: string | null;
    address: string | null;
    baptism_date: string | null;
    is_baptized: boolean;
    sector_id: number | null;
    church_position: string;
    status: string;
    created_at: string;
    updated_at: string;
    sincronizado?: boolean;
}

export interface IncomeLocal {
    id: string;
    amount: number;
    date: string;
    category: string;
    period: string | null;
    member_id: string | null;
    sector_id: number | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    sincronizado?: boolean;
}

export interface ExpenseLocal {
    id: string;
    amount: number;
    date: string;
    category: string;
    description: string;
    receipt_url: string | null;
    created_at: string;
    updated_at: string;
    sincronizado?: boolean;
}

export interface QueueItemLocal {
    id?: number;
    tabla: string;
    operacion: 'INSERT' | 'UPDATE' | 'DELETE';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    datos: any;
    timestamp: string;
    intentos: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDB(): Promise<IDBPDatabase<any>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Members store
            if (!db.objectStoreNames.contains('members')) {
                const membersStore = db.createObjectStore('members', { keyPath: 'id' });
                membersStore.createIndex('by-sector', 'sector_id');
                membersStore.createIndex('by-status', 'status');
            }

            // Income store
            if (!db.objectStoreNames.contains('income')) {
                const incomeStore = db.createObjectStore('income', { keyPath: 'id' });
                incomeStore.createIndex('by-date', 'date');
                incomeStore.createIndex('by-category', 'category');
                incomeStore.createIndex('by-member', 'member_id');
            }

            // Expenses store
            if (!db.objectStoreNames.contains('expenses')) {
                const expensesStore = db.createObjectStore('expenses', { keyPath: 'id' });
                expensesStore.createIndex('by-date', 'date');
                expensesStore.createIndex('by-category', 'category');
            }

            // Sectors store (cache)
            if (!db.objectStoreNames.contains('sectors')) {
                db.createObjectStore('sectors', { keyPath: 'id' });
            }

            // Offline queue store
            if (!db.objectStoreNames.contains('offlineQueue')) {
                const queueStore = db.createObjectStore('offlineQueue', {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                queueStore.createIndex('by-tabla', 'tabla');
            }
        },
    });

    return dbInstance;
}

type StoreName = 'members' | 'income' | 'expenses' | 'sectors' | 'offlineQueue';

// CRUD operations
export async function saveToLocal(
    storeName: StoreName,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
): Promise<void> {
    const db = await getDB();
    await db.put(storeName, data);
}

export async function getFromLocal<T>(
    storeName: StoreName,
    key: string | number
): Promise<T | undefined> {
    const db = await getDB();
    return db.get(storeName, key);
}

export async function getAllFromLocal<T>(storeName: StoreName): Promise<T[]> {
    const db = await getDB();
    return db.getAll(storeName);
}

export async function deleteFromLocal(
    storeName: StoreName,
    key: string | number
): Promise<void> {
    const db = await getDB();
    await db.delete(storeName, key);
}

export async function clearStore(storeName: StoreName): Promise<void> {
    const db = await getDB();
    await db.clear(storeName);
}

export default {
    getDB,
    saveToLocal,
    getFromLocal,
    getAllFromLocal,
    deleteFromLocal,
    clearStore,
};
