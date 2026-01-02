// Simple store using React Context pattern (no external dependencies)
import { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';

interface SessionContextType {
    user: User | null;
    theme: 'light' | 'dark' | 'system';
    sidebarOpen: boolean;
    setUser: (user: User | null) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    toggleSidebar: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => setSidebarOpen(prev => !prev);

    return (
        <SessionContext.Provider
            value={{
                user,
                theme,
                sidebarOpen,
                setUser,
                setTheme,
                toggleSidebar,
            }}
        >
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
