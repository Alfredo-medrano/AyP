import { useState } from 'react';
import { useSignIn, useSignUp, useResetPassword } from './hooks';
import './auth.css';

type AuthMode = 'signin' | 'signup' | 'reset';

export function AuthPage() {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [message, setMessage] = useState('');

    const signIn = useSignIn();
    const signUp = useSignUp();
    const resetPassword = useResetPassword();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        try {
            if (mode === 'signin') {
                await signIn.mutateAsync({ email, password });
            } else if (mode === 'signup') {
                await signUp.mutateAsync({ email, password, nombre });
                setMessage('¡Cuenta creada! Revisa tu email para confirmar.');
            } else {
                await resetPassword.mutateAsync(email);
                setMessage('Te enviamos un email para restablecer tu contraseña.');
            }
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error desconocido');
        }
    };

    const isLoading = signIn.isPending || signUp.isPending || resetPassword.isPending;

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">
                    {mode === 'signin' && 'Iniciar Sesión'}
                    {mode === 'signup' && 'Crear Cuenta'}
                    {mode === 'reset' && 'Restablecer Contraseña'}
                </h1>

                <form onSubmit={handleSubmit} className="auth-form">
                    {mode === 'signup' && (
                        <div className="form-group">
                            <label htmlFor="nombre">Nombre</label>
                            <input
                                id="nombre"
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Tu nombre"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            required
                        />
                    </div>

                    {mode !== 'reset' && (
                        <div className="form-group">
                            <label htmlFor="password">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    )}

                    {message && (
                        <p className={`message ${signIn.isError || signUp.isError ? 'error' : 'success'}`}>
                            {message}
                        </p>
                    )}

                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Cargando...' : (
                            <>
                                {mode === 'signin' && 'Entrar'}
                                {mode === 'signup' && 'Registrarse'}
                                {mode === 'reset' && 'Enviar Email'}
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-links">
                    {mode === 'signin' && (
                        <>
                            <button onClick={() => setMode('signup')}>
                                ¿No tienes cuenta? Regístrate
                            </button>
                            <button onClick={() => setMode('reset')}>
                                ¿Olvidaste tu contraseña?
                            </button>
                        </>
                    )}
                    {mode !== 'signin' && (
                        <button onClick={() => setMode('signin')}>
                            Volver a iniciar sesión
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AuthPage;
