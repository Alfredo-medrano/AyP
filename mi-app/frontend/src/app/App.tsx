import { useEffect } from 'react';
import { AppRouter } from './router';
import { setupAutoSync } from '../services/syncService';
import { useOffline } from '../hooks/useOffline';
import { syncWithServer } from '../services/syncService';
import './app.css';

export function App() {
    const { isOffline, wasOffline } = useOffline();

    // Setup auto-sync when coming back online
    useEffect(() => {
        const cleanup = setupAutoSync();
        return cleanup;
    }, []);

    // Trigger sync when coming back online
    useEffect(() => {
        if (wasOffline && !isOffline) {
            syncWithServer().then((result) => {
                console.log('Sync result:', result);
            });
        }
    }, [isOffline, wasOffline]);

    return (
        <div className="app">
            <AppRouter />
        </div>
    );
}

export default App;
