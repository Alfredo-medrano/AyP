// Database types for Supabase - Church Management System

export type AppRole = 'pastor' | 'secretario';
export type ChurchRole = 'Miembro' | 'Ministro' | 'Diácono' | 'Ayudante' | 'Pastor' | 'Co-Pastor' | 'Otro';
export type MemberStatus = 'Activo' | 'Inactivo' | 'Disciplinado';
export type IncomeCategory = 'Diezmo' | 'Ofrenda General' | 'Pro-templo' | 'Ofrenda Especial';
export type ExpenseCategory = 'Servicios Basicos' | 'Mantenimiento' | 'Ayuda Social' | 'Limpieza' | 'Otros';

// Constants for UI - matching database ENUMs and CHECK constraints
export const CHURCH_ROLES: ChurchRole[] = ['Miembro', 'Ministro', 'Diácono', 'Ayudante', 'Pastor', 'Co-Pastor', 'Otro'];
export const MEMBER_STATUSES: MemberStatus[] = ['Activo', 'Inactivo', 'Disciplinado'];
export const INCOME_CATEGORIES: IncomeCategory[] = ['Diezmo', 'Ofrenda General', 'Pro-templo', 'Ofrenda Especial'];
export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Servicios Basicos', 'Mantenimiento', 'Ayuda Social', 'Limpieza', 'Otros'];

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
    // Joined data
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
    // Joined data
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
    funding_source: IncomeCategory | null; // Where the funds came from
    created_by: string | null;
    deleted_at: string | null;
}

// Database schema for Supabase client
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Profile, 'id'>>;
            };
            sectors: {
                Row: Sector;
                Insert: Omit<Sector, 'id'>;
                Update: Partial<Omit<Sector, 'id'>>;
            };
            members: {
                Row: Member;
                Insert: Omit<Member, 'id' | 'created_at' | 'updated_at' | 'is_baptized' | 'created_by'>;
                Update: Partial<Omit<Member, 'id' | 'created_at' | 'is_baptized' | 'created_by'>>;
            };
            income: {
                Row: Income;
                Insert: Omit<Income, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'deleted_at'>;
                Update: Partial<Omit<Income, 'id' | 'created_at' | 'created_by'>>;
            };
            expenses: {
                Row: Expense;
                Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'deleted_at'>;
                Update: Partial<Omit<Expense, 'id' | 'created_at' | 'created_by'>>;
            };
        };
        Enums: {
            app_role: AppRole;
            church_role: ChurchRole;
        };
    };
}
