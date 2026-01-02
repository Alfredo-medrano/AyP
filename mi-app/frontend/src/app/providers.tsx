import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from '../lib/react-query';
import { SessionProvider } from '../store/sessionStore';
import { NotificationProvider } from '../components/ui';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <SessionProvider>
                <BrowserRouter>
                    <NotificationProvider>
                        {children}
                    </NotificationProvider>
                </BrowserRouter>
            </SessionProvider>
        </QueryClientProvider>
    );
}

export default Providers;

