import { useState, useEffect } from 'react';
import type { Expense, ExpenseCategory, IncomeCategory } from '../../types/database';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../types/database';
import { useFundBalances } from '../../hooks/useFundBalances';

interface ExpenseModalProps {
    isOpen: boolean;
    mode: 'create' | 'edit';
    expense: Expense | null;
    onClose: () => void;
    onSave: (data: ExpenseFormData) => void;
    isLoading?: boolean;
}

export interface ExpenseFormData {
    amount: number;
    date: string;
    category: ExpenseCategory;
    description: string;
    funding_source: IncomeCategory;
}

const initialFormData: ExpenseFormData = {
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'Otros',
    description: '',
    funding_source: 'Ofrenda General',
};

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-SV', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

export function ExpenseModal({ isOpen, mode, expense, onClose, onSave, isLoading }: ExpenseModalProps) {
    const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
    const { balances, getBalance } = useFundBalances();

    useEffect(() => {
        if (expense && mode === 'edit') {
            setFormData({
                amount: expense.amount,
                date: expense.date,
                category: expense.category,
                description: expense.description,
                funding_source: expense.funding_source || 'Ofrenda General',
            });
        } else {
            setFormData(initialFormData);
        }
    }, [expense, mode, isOpen]);

    if (!isOpen) return null;

    const selectedFundBalance = getBalance(formData.funding_source);
    const isOverBudget = formData.amount > selectedFundBalance && mode === 'create';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0 || !formData.description.trim()) {
            return;
        }
        if (isOverBudget) {
            return; // Don't allow submitting if over budget
        }
        onSave(formData);
    };

    const handleChange = (field: keyof ExpenseFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const title = mode === 'create' ? 'Registrar Gasto' : 'Editar Gasto';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="expense-modal-body">
                        {/* Fund Balances Summary */}
                        <div className="fund-balances-summary">
                            <h4 className="fund-summary-title">💰 Fondos Disponibles</h4>
                            <div className="fund-balances-grid">
                                {balances.map(balance => (
                                    <div
                                        key={balance.category}
                                        className={`fund-balance-item ${formData.funding_source === balance.category ? 'selected' : ''} ${balance.available <= 0 ? 'empty' : ''}`}
                                        onClick={() => balance.available > 0 && handleChange('funding_source', balance.category)}
                                    >
                                        <span className="fund-name">{balance.category}</span>
                                        <span className={`fund-amount ${balance.available <= 0 ? 'negative' : ''}`}>
                                            {formatCurrency(balance.available)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="expense-form-grid">
                            <div className="expense-form-group">
                                <label className="expense-form-label">Monto ($) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className={`expense-form-input ${isOverBudget ? 'input-error' : ''}`}
                                    value={formData.amount || ''}
                                    onChange={e => {
                                        const value = e.target.value;
                                        // Round to 2 decimal places to avoid floating point issues
                                        const amount = value ? Math.round(parseFloat(value) * 100) / 100 : 0;
                                        handleChange('amount', amount);
                                    }}
                                    placeholder="0.00"
                                    required
                                />
                                {isOverBudget && (
                                    <span className="input-error-text">
                                        Excede el saldo disponible de {formatCurrency(selectedFundBalance)}
                                    </span>
                                )}
                            </div>

                            <div className="expense-form-group">
                                <label className="expense-form-label">Fecha *</label>
                                <input
                                    type="date"
                                    className="expense-form-input"
                                    value={formData.date}
                                    onChange={e => handleChange('date', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="expense-form-group">
                                <label className="expense-form-label">Fuente de Fondos *</label>
                                <select
                                    className="expense-form-select"
                                    value={formData.funding_source}
                                    onChange={e => handleChange('funding_source', e.target.value)}
                                    required
                                >
                                    {INCOME_CATEGORIES.map(cat => {
                                        const balance = getBalance(cat);
                                        return (
                                            <option
                                                key={cat}
                                                value={cat}
                                                disabled={balance <= 0 && mode === 'create'}
                                            >
                                                {cat} ({formatCurrency(balance)})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="expense-form-group">
                                <label className="expense-form-label">Tipo de Gasto *</label>
                                <select
                                    className="expense-form-select"
                                    value={formData.category}
                                    onChange={e => handleChange('category', e.target.value)}
                                    required
                                >
                                    {EXPENSE_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="expense-form-group full-width">
                                <label className="expense-form-label">Descripción *</label>
                                <textarea
                                    className="expense-form-textarea"
                                    value={formData.description}
                                    onChange={e => handleChange('description', e.target.value)}
                                    placeholder="Descripción del gasto..."
                                    rows={3}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-save"
                            disabled={isLoading || formData.amount <= 0 || !formData.description.trim() || isOverBudget}
                        >
                            {isLoading ? 'Guardando...' : mode === 'create' ? 'Registrar Gasto' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ExpenseModal;
