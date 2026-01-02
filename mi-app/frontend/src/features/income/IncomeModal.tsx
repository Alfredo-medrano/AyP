import { useState, useEffect } from 'react';
import { useMembers } from '../members/hooks';
import { useSectors } from '../sectors/hooks';
import type { Income, IncomeCategory } from '../../types/database';
import { INCOME_CATEGORIES } from '../../types/database';

interface IncomeModalProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    income: Income | null;
    onClose: () => void;
    onSave: (data: IncomeFormData) => void;
    isLoading?: boolean;
}

export interface IncomeFormData {
    amount: number;
    date: string;
    category: IncomeCategory;
    period: string;
    member_id: string;
    sector_id: number | null;
    notes: string;
}

const initialFormData: IncomeFormData = {
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'Ofrenda General',
    period: '',
    member_id: '',
    sector_id: null,
    notes: '',
};

export function IncomeModal({ isOpen, mode, income, onClose, onSave, isLoading }: IncomeModalProps) {
    const { data: members = [] } = useMembers();
    const { data: sectors = [] } = useSectors();
    const [formData, setFormData] = useState<IncomeFormData>(initialFormData);

    useEffect(() => {
        if (income && mode === 'edit') {
            setFormData({
                amount: income.amount,
                date: income.date,
                category: income.category,
                period: income.period || '',
                member_id: income.member_id || '',
                sector_id: income.sector_id,
                notes: income.notes || '',
            });
        } else {
            setFormData(initialFormData);
        }
    }, [income, mode, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0) {
            return;
        }
        onSave(formData);
    };

    const handleChange = (field: keyof IncomeFormData, value: string | number | null) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const title = mode === 'create' ? 'Registrar Ingreso' : 'Editar Ingreso';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="income-modal-body">
                        <div className="income-form-grid">
                            <div className="income-form-group">
                                <label className="income-form-label">Monto ($) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="income-form-input"
                                    value={formData.amount || ''}
                                    onChange={e => handleChange('amount', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div className="income-form-group">
                                <label className="income-form-label">Fecha *</label>
                                <input
                                    type="date"
                                    className="income-form-input"
                                    value={formData.date}
                                    onChange={e => handleChange('date', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="income-form-group">
                                <label className="income-form-label">Categoría *</label>
                                <select
                                    className="income-form-select"
                                    value={formData.category}
                                    onChange={e => handleChange('category', e.target.value)}
                                    required
                                >
                                    {INCOME_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="income-form-group">
                                <label className="income-form-label">Período (opcional)</label>
                                <input
                                    type="text"
                                    className="income-form-input"
                                    value={formData.period}
                                    onChange={e => handleChange('period', e.target.value)}
                                    placeholder="Ej: Enero 2026"
                                />
                            </div>

                            <div className="income-form-group">
                                <label className="income-form-label">Miembro (opcional)</label>
                                <select
                                    className="income-form-select"
                                    value={formData.member_id}
                                    onChange={e => handleChange('member_id', e.target.value)}
                                >
                                    <option value="">Sin asignar</option>
                                    {members.map(member => (
                                        <option key={member.id} value={member.id}>
                                            {member.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="income-form-group">
                                <label className="income-form-label">Sector (opcional)</label>
                                <select
                                    className="income-form-select"
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

                            <div className="income-form-group full-width">
                                <label className="income-form-label">Notas (opcional)</label>
                                <textarea
                                    className="income-form-textarea"
                                    value={formData.notes}
                                    onChange={e => handleChange('notes', e.target.value)}
                                    placeholder="Agregar notas adicionales..."
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-save" disabled={isLoading || formData.amount <= 0}>
                            {isLoading ? 'Guardando...' : mode === 'create' ? 'Registrar Ingreso' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default IncomeModal;
