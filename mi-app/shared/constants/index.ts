// Shared constants for Church Management System

// Church positions
export const CHURCH_POSITIONS = [
    'Miembro',
    'Ministro',
    'Diácono',
    'Ayudante',
    'Otro',
] as const;

export const MEMBER_STATUSES = [
    'Activo',
    'Inactivo',
    'Disciplinado',
] as const;

// Income categories
export const INCOME_CATEGORIES = [
    'Diezmo',
    'Ofrenda General',
    'Pro-templo',
    'Ofrenda Especial',
] as const;

// Expense categories
export const EXPENSE_CATEGORIES = [
    'Servicios Basicos',
    'Mantenimiento',
    'Ayuda Social',
    'Limpieza',
    'Otros',
] as const;

// App roles
export const APP_ROLES = ['pastor', 'secretario'] as const;

// Labels
export const INCOME_CATEGORY_LABELS: Record<string, string> = {
    'Diezmo': 'Diezmo',
    'Ofrenda General': 'Ofrenda General',
    'Pro-templo': 'Pro-templo',
    'Ofrenda Especial': 'Ofrenda Especial',
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
    'Servicios Basicos': 'Servicios Básicos',
    'Mantenimiento': 'Mantenimiento',
    'Ayuda Social': 'Ayuda Social',
    'Limpieza': 'Limpieza',
    'Otros': 'Otros',
};

// App configuration
export const APP_CONFIG = {
    name: 'Sistema de Gestión de Iglesia',
    version: '1.0.0',
    description: 'Aplicación para gestión de miembros, ingresos y gastos de la iglesia',
    defaultCurrency: 'USD',
    defaultLocale: 'es-SV',
    maxSyncRetries: 5,
    syncIntervalMs: 30000,
    cacheExpirationMs: 1000 * 60 * 60 * 24,
};

// Format currency
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-SV', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

// Format date
export function formatDate(date: string): string {
    return new Intl.DateTimeFormat('es-SV', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
}

export function formatShortDate(date: string): string {
    return new Intl.DateTimeFormat('es-SV', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(date));
}
