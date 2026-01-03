import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout';
import { AuthPage } from '../features/auth/AuthPage';
import { MembersPage } from '../features/members/MembersPage';
import { IncomePage } from '../features/income/IncomePage';
import { ExpensesPage } from '../features/expenses/ExpensesPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { useAuth } from '../hooks/useAuth';


function ConfigurationWarning() {
    return (
        <div style={{
            padding: '40px',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '40px auto',
            fontFamily: 'system-ui, sans-serif'
        }}>
            <h1 style={{ color: '#f59e0b' }}>⚠️ Configuración Requerida</h1>
            <p>Para usar esta aplicación, necesitas configurar Supabase.</p>
            <div style={{
                background: '#1e1e1e',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'left',
                marginTop: '20px',
                color: '#e5e5e5'
            }}>
                <p style={{ margin: '0 0 10px 0' }}><strong>1.</strong> Crea un proyecto en <a href="https://supabase.com" style={{ color: '#3b82f6' }}>supabase.com</a></p>
                <p style={{ margin: '0 0 10px 0' }}><strong>2.</strong> Copia tu URL y Anon Key</p>
                <p style={{ margin: '0 0 10px 0' }}><strong>3.</strong> Edita el archivo <code style={{ background: '#333', padding: '2px 6px', borderRadius: '4px' }}>.env</code>:</p>
                <pre style={{
                    background: '#2d2d2d',
                    padding: '15px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '14px'
                }}>
                    {`VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key`}
                </pre>
                <p style={{ margin: '10px 0 0 0' }}><strong>4.</strong> Reinicia el servidor de desarrollo</p>
            </div>
        </div>
    );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading, isConfigured } = useAuth();

    // Show configuration warning if Supabase is not set up
    if (!isConfigured) {
        return <ConfigurationWarning />;
    }

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontFamily: 'system-ui, sans-serif'
            }}>
                Cargando...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    return <MainLayout>{children}</MainLayout>;
}

export function AppRouter() {
    const { isAuthenticated, isConfigured } = useAuth();

    return (
        <Routes>
            <Route
                path="/auth"
                element={
                    !isConfigured ? <ConfigurationWarning /> :
                        isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
                }
            />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MembersPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/ingresos"
                element={
                    <ProtectedRoute>
                        <IncomePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/gastos"
                element={
                    <ProtectedRoute>
                        <ExpensesPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/reportes"
                element={
                    <ProtectedRoute>
                        <ReportsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/perfil"
                element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default AppRouter;
