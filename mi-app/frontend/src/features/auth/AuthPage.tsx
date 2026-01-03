import { useState } from 'react';
import { useSignIn, useResetPassword } from './hooks';
import './auth.css';
import logoAyP from '../../assets/AyP.svg';

type AuthMode = 'signin' | 'reset';

export function AuthPage() {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const signIn = useSignIn();
    const resetPassword = useResetPassword();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        try {
            if (mode === 'signin') {
                await signIn.mutateAsync({ email, password });
            } else {
                await resetPassword.mutateAsync(email);
                setMessage('Te enviamos un email para restablecer tu contraseña.');
            }
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Error desconocido');
        }
    };

    const isLoading = signIn.isPending || resetPassword.isPending;

    return (
        <div className="auth-container">
            {/* Decorative circles */}
            <div className="auth-decoration auth-decoration-1"></div>
            <div className="auth-decoration auth-decoration-2"></div>
            <div className="auth-decoration auth-decoration-3"></div>

            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo-container">
                    <img src={logoAyP} alt="Logo Iglesia" className="auth-logo" />
                </div>

                {/* Title */}
                <h1 className="auth-title">
                    {mode === 'signin' && 'Bienvenido'}
                    {mode === 'reset' && 'Recuperar Contraseña'}
                </h1>
                <p className="auth-subtitle">
                    {mode === 'signin' && 'Ingresa tus credenciales para continuar'}
                    {mode === 'reset' && 'Te enviaremos un enlace a tu correo'}
                </p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">
                            <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            Correo Electrónico
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ejemplo@correo.com"
                            required
                        />
                    </div>

                    {mode === 'signin' && (
                        <div className="form-group">
                            <label htmlFor="password">
                                <svg className="form-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                Contraseña
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {message && (
                        <p className={`message ${signIn.isError ? 'error' : 'success'}`}>
                            {message}
                        </p>
                    )}

                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? (
                            <span className="loading-spinner"></span>
                        ) : (
                            <>
                                {mode === 'signin' && 'Iniciar Sesión'}
                                {mode === 'reset' && 'Enviar Correo'}
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-links">
                    {mode === 'signin' ? (
                        <button onClick={() => setMode('reset')}>
                            ¿Olvidaste tu contraseña?
                        </button>
                    ) : (
                        <button onClick={() => setMode('signin')}>
                            Volver a iniciar sesión
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="auth-footer">
                    <p>Sistema de Administración</p>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;
