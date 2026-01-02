import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import './notifications.css';

// ============ Types ============
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    exiting?: boolean;
}

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

interface NotificationContextType {
    // Toast functions
    showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    // Confirm function
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

// ============ Context ============
const NotificationContext = createContext<NotificationContextType | null>(null);

// ============ Icons ============
const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

const confirmIcons: Record<string, string> = {
    danger: '🗑️',
    warning: '⚠️',
    info: 'ℹ️',
};

// ============ Toast Component ============
function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
    return (
        <div className={`toast ${toast.type} ${toast.exiting ? 'exiting' : ''}`}>
            <span className="toast-icon">{icons[toast.type]}</span>
            <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button className="toast-close" onClick={() => onClose(toast.id)}>
                ✕
            </button>
            {toast.duration && (
                <div
                    className="toast-progress"
                    style={{ animationDuration: `${toast.duration}ms` }}
                />
            )}
        </div>
    );
}

// ============ Confirm Dialog Component ============
function ConfirmDialog({
    options,
    onConfirm,
    onCancel,
}: {
    options: ConfirmOptions;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const type = options.type || 'warning';

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
                <div className="confirm-header">
                    <div className={`confirm-icon ${type}`}>
                        {confirmIcons[type]}
                    </div>
                    <div className="confirm-header-text">
                        <h3>{options.title}</h3>
                        <p>{options.message}</p>
                    </div>
                </div>
                <div className="confirm-footer">
                    <button className="confirm-btn cancel" onClick={onCancel}>
                        {options.cancelText || 'Cancelar'}
                    </button>
                    <button
                        className={`confirm-btn ${type === 'danger' ? 'danger' : 'confirm'}`}
                        onClick={onConfirm}
                    >
                        {options.confirmText || 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============ Provider Component ============
export function NotificationProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmState, setConfirmState] = useState<{
        options: ConfirmOptions;
        resolve: (value: boolean) => void;
    } | null>(null);

    const removeToast = useCallback((id: string) => {
        // Mark as exiting for animation
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        // Remove after animation
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 200);
    }, []);

    const showToast = useCallback((
        type: ToastType,
        title: string,
        message?: string,
        duration: number = 4000
    ) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const toast: Toast = { id, type, title, message, duration };

        setToasts(prev => [...prev, toast]);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => removeToast(id), duration);
        }
    }, [removeToast]);

    const success = useCallback((title: string, message?: string) => {
        showToast('success', title, message);
    }, [showToast]);

    const error = useCallback((title: string, message?: string) => {
        showToast('error', title, message, 6000);
    }, [showToast]);

    const warning = useCallback((title: string, message?: string) => {
        showToast('warning', title, message, 5000);
    }, [showToast]);

    const info = useCallback((title: string, message?: string) => {
        showToast('info', title, message);
    }, [showToast]);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setConfirmState({ options, resolve });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (confirmState) {
            confirmState.resolve(true);
            setConfirmState(null);
        }
    }, [confirmState]);

    const handleCancel = useCallback(() => {
        if (confirmState) {
            confirmState.resolve(false);
            setConfirmState(null);
        }
    }, [confirmState]);

    const value: NotificationContextType = {
        showToast,
        success,
        error,
        warning,
        info,
        confirm,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}

            {/* Toast Container */}
            {toasts.length > 0 && (
                <div className="toast-container">
                    {toasts.map(toast => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onClose={removeToast}
                        />
                    ))}
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmState && (
                <ConfirmDialog
                    options={confirmState.options}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </NotificationContext.Provider>
    );
}

// ============ Hook ============
export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
}

export default NotificationProvider;
