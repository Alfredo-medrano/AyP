import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import type { AppRole } from '../../types/database';
import './profile.css';

// Mapping of roles to display names
const ROLE_DISPLAY_NAMES: Record<AppRole, string> = {
    'pastor': 'Pastor',
    'secretario': 'Secretario'
};

export function ProfilePage() {
    const { user, signOut } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [nombre, setNombre] = useState(user?.user_metadata?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [userRole, setUserRole] = useState<AppRole | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch user profile with role from database
    useEffect(() => {
        async function fetchProfile() {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('role, full_name')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    const profileData = data as { role: AppRole; full_name: string | null };
                    setUserRole(profileData.role);
                    if (profileData.full_name) {
                        setNombre(profileData.full_name);
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoadingProfile(false);
            }
        }

        fetchProfile();
    }, [user?.id]);

    const handleUpdateProfile = async () => {
        setLoading(true);
        setMessage(null);

        try {
            const emailChanged = email !== user?.email;

            // Update auth user data (name and optionally email)
            const updateData: { data: { full_name: string }; email?: string } = {
                data: { full_name: nombre }
            };

            if (emailChanged) {
                updateData.email = email;
            }

            const { error: authError } = await supabase.auth.updateUser(updateData);

            if (authError) throw authError;

            // Also update the profiles table
            if (user?.id) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { error: profileError } = await (supabase as any)
                    .from('profiles')
                    .update({ full_name: nombre })
                    .eq('id', user.id);

                if (profileError) throw profileError;
            }

            if (emailChanged) {
                setMessage({
                    type: 'success',
                    text: 'Perfil actualizado. Se envió un correo de confirmación a tu nuevo email.'
                });
            } else {
                setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
            }
            setIsEditing(false);
        } catch (error) {
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : 'Error al actualizar perfil'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
    };

    const userInitials = nombre
        ? nombre.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.email?.[0].toUpperCase() || 'U';

    const displayRole = userRole ? ROLE_DISPLAY_NAMES[userRole] : 'Usuario';

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1>Mi Perfil</h1>
                <p>Gestiona tu información personal</p>
            </div>

            <div className="profile-content">
                {/* Avatar Card */}
                <div className="profile-card avatar-card">
                    <div className="avatar-large">
                        {userInitials}
                    </div>
                    <h2 className="profile-name">
                        {nombre || 'Usuario'}
                    </h2>
                    <p className="profile-email">{user?.email}</p>
                    <span className="profile-role">
                        {loadingProfile ? 'Cargando...' : displayRole}
                    </span>
                </div>

                {/* Info Card */}
                <div className="profile-card info-card">
                    <div className="card-header">
                        <h3>Información Personal</h3>
                        {!isEditing && (
                            <button
                                className="edit-btn"
                                onClick={() => setIsEditing(true)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Editar
                            </button>
                        )}
                    </div>

                    {message && (
                        <div className={`profile-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="info-grid">
                        <div className="info-item">
                            <label>Nombre Completo</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Tu nombre"
                                />
                            ) : (
                                <p>{nombre || 'No especificado'}</p>
                            )}
                        </div>

                        <div className="info-item">
                            <label>Correo Electrónico</label>
                            {isEditing ? (
                                <>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                    />
                                    <small className="email-hint">
                                        Se enviará un correo de confirmación si cambias el email
                                    </small>
                                </>
                            ) : (
                                <p>{user?.email}</p>
                            )}
                        </div>

                        <div className="info-item">
                            <label>Miembro desde</label>
                            <p>{user?.created_at
                                ? new Date(user.created_at).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })
                                : 'No disponible'
                            }</p>
                        </div>

                        <div className="info-item">
                            <label>Último acceso</label>
                            <p>{user?.last_sign_in_at
                                ? new Date(user.last_sign_in_at).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })
                                : 'No disponible'
                            }</p>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="edit-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => {
                                    setIsEditing(false);
                                    setNombre(user?.user_metadata?.full_name || '');
                                    setEmail(user?.email || '');
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-save"
                                onClick={handleUpdateProfile}
                                disabled={loading}
                            >
                                {loading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Security Card */}
                <div className="profile-card security-card">
                    <div className="card-header">
                        <h3>Seguridad</h3>
                    </div>

                    <div className="security-item">
                        <div className="security-info">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <div>
                                <h4>Contraseña</h4>
                                <p>Última actualización: No disponible</p>
                            </div>
                        </div>
                        <button className="btn-secondary">
                            Cambiar
                        </button>
                    </div>

                    <div className="security-divider"></div>

                    <div className="security-item">
                        <div className="security-info">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            <div>
                                <h4>Cerrar Sesión</h4>
                                <p>Salir de tu cuenta en este dispositivo</p>
                            </div>
                        </div>
                        <button
                            className="btn-danger"
                            onClick={handleSignOut}
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
