// Shared types for Church Management System

export type AppRole = 'pastor' | 'secretario';
export type ChurchRole = 'Miembro' | 'Ministro' | 'Diácono' | 'Ayudante' | 'Otro';
export type MemberStatus = 'Activo' | 'Inactivo' | 'Disciplinado';
export type IncomeCategory = 'Diezmo' | 'Ofrenda General' | 'Pro-templo' | 'Ofrenda Especial';
export type ExpenseCategory = 'Servicios Basicos' | 'Mantenimiento' | 'Ayuda Social' | 'Limpieza' | 'Otros';

export interface Profile {
    id: string;
    full_name: string | null;
    role: AppRole;
    created_at: string;
    updated_at: string;
}

export interface Sector {
    id: number;
    name: string;
}

export interface Member {
    id: string;
    created_at: string;
    updated_at: string;
    full_name: string;
    dui: string | null;
    phone: string | null;
    address: string | null;
    baptism_date: string | null;
    is_baptized: boolean;
    sector_id: number | null;
    church_position: ChurchRole;
    status: MemberStatus;
    created_by: string | null;
    sector?: Sector;
}

export interface Income {
    id: string;
    created_at: string;
    updated_at: string;
    amount: number;
    date: string;
    category: IncomeCategory;
    period: string | null;
    member_id: string | null;
    sector_id: number | null;
    notes: string | null;
    created_by: string | null;
    deleted_at: string | null;
    member?: Member;
    sector?: Sector;
}

export interface Expense {
    id: string;
    created_at: string;
    updated_at: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    description: string;
    receipt_url: string | null;
    created_by: string | null;
    deleted_at: string | null;
}

export interface SyncOperation {
    tabla: string;
    operacion: 'INSERT' | 'UPDATE' | 'DELETE';
    datos: Record<string, unknown>;
    timestamp: string;
}

export interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
}
