import { useState, useEffect } from 'react';

export function useOffline() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setWasOffline(isOffline);
            setIsOffline(false);
        };

        const handleOffline = () => {
            setIsOffline(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isOffline]);

    return { isOffline, wasOffline };
}

export default useOffline;
