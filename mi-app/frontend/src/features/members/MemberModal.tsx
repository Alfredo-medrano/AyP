import { useState, useEffect } from 'react';
import { useSectors } from '../sectors/hooks';
import type { Member, ChurchRole, MemberStatus } from '../../types/database';
import { CHURCH_ROLES, MEMBER_STATUSES } from '../../types/database';

interface MemberModalProps {
    isOpen: boolean;
    mode: 'create' | 'edit' | 'view';
    member: Member | null;
    onClose: () => void;
    onSave: (data: MemberFormData) => void;
    isLoading?: boolean;
}

export interface MemberFormData {
    full_name: string;
    dui: string;
    phone: string;
    address: string;
    baptism_date: string;
    sector_id: number | null;
    church_position: ChurchRole;
    status: MemberStatus;
}

const initialFormData: MemberFormData = {
    full_name: '',
    dui: '',
    phone: '',
    address: '',
    baptism_date: '',
    sector_id: null,
    church_position: 'Miembro',
    status: 'Activo',
};

export function MemberModal({ isOpen, mode, member, onClose, onSave, isLoading }: MemberModalProps) {
    const { data: sectors = [] } = useSectors();
    const [formData, setFormData] = useState<MemberFormData>(initialFormData);

    useEffect(() => {
        if (member && (mode === 'edit' || mode === 'view')) {
            setFormData({
                full_name: member.full_name,
                dui: member.dui || '',
                phone: member.phone || '',
                address: member.address || '',
                baptism_date: member.baptism_date || '',
                sector_id: member.sector_id,
                church_position: member.church_position,
                status: member.status,
            });
        } else {
            setFormData(initialFormData);
        }
    }, [member, mode, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleChange = (field: keyof MemberFormData, value: string | number | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isViewMode = mode === 'view';
    const title = mode === 'create'
        ? 'Nuevo Miembro'
        : mode === 'edit'
            ? 'Editar Miembro'
            : 'Detalles del Miembro';

    // View mode - different layout
    if (isViewMode && member) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="member-view-header">
                        <div className="member-view-avatar">
                            {member.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="member-view-info">
                            <h2>{member.full_name}</h2>
                            <p>{member.church_position} • {member.status}</p>
                        </div>
                        <button className="modal-close" onClick={onClose}>✕</button>
                    </div>
                    <div className="member-view-details">
                        <div className="detail-row">
                            <span className="detail-label">DUI</span>
                            <span className="detail-value">{member.dui || 'No registrado'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Teléfono</span>
                            <span className="detail-value">{member.phone || 'No registrado'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Dirección</span>
                            <span className="detail-value">{member.address || 'No registrada'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Sector</span>
                            <span className="detail-value">{member.sector?.name || 'Sin asignar'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Bautizado</span>
                            <span className="detail-value">
                                {member.is_baptized
                                    ? `Sí (${member.baptism_date})`
                                    : 'No'}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Registrado</span>
                            <span className="detail-value">
                                {new Date(member.created_at).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn-cancel" onClick={onClose}>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Create/Edit mode
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-section">
                            <h3 className="form-section-title">Información Personal</h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label className="form-label">Nombre Completo *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.full_name}
                                        onChange={e => handleChange('full_name', e.target.value)}
                                        placeholder="Ingrese el nombre completo"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">DUI</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.dui}
                                        onChange={e => handleChange('dui', e.target.value)}
                                        placeholder="00000000-0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Teléfono</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={e => handleChange('phone', e.target.value)}
                                        placeholder="0000-0000"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label className="form-label">Dirección</label>
                                    <textarea
                                        className="form-textarea"
                                        value={formData.address}
                                        onChange={e => handleChange('address', e.target.value)}
                                        placeholder="Ingrese la dirección completa"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="form-section-title">Información Eclesiástica</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Sector</label>
                                    <select
                                        className="form-select"
                                        value={formData.sector_id ?? ''}
                                        onChange={e => handleChange('sector_id', e.target.value ? Number(e.target.value) : null)}
                                    >
                                        <option value="">Sin asignar</option>
                                        {sectors.map(sector => (
                                            <option key={sector.id} value={sector.id}>
                                                {sector.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Cargo</label>
                                    <select
                                        className="form-select"
                                        value={formData.church_position}
                                        onChange={e => handleChange('church_position', e.target.value)}
                                    >
                                        {CHURCH_ROLES.map(pos => (
                                            <option key={pos} value={pos}>{pos}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Estado</label>
                                    <select
                                        className="form-select"
                                        value={formData.status}
                                        onChange={e => handleChange('status', e.target.value)}
                                    >
                                        {MEMBER_STATUSES.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Fecha de Bautismo</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.baptism_date}
                                        onChange={e => handleChange('baptism_date', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-save" disabled={isLoading}>
                            {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear Miembro' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MemberModal;
