import { useState, useMemo } from 'react';
import { useIncomes, useIncomeStats, useCreateIncome, useUpdateIncome, useDeleteIncome } from './hooks';
import { IncomeModal, type IncomeFormData } from './IncomeModal';
import { useNotification } from '../../components/ui';
import { exportToExcel, exportToPDF } from '../../utils/export';
import { useFundBalances } from '../../hooks/useFundBalances';
import type { Income, IncomeCategory } from '../../types/database';
import { INCOME_CATEGORIES } from '../../types/database';
import './income.css';
import '../members/members.css'; // Reuse modal styles

interface FiltersState {
    category: IncomeCategory | null;
    startDate: string;
    endDate: string;
}

const initialFilters: FiltersState = {
    category: null,
    startDate: '',
    endDate: '',
};

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-SV', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

function formatDate(dateString: string): string {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function getCategoryClass(category: IncomeCategory): string {
    switch (category) {
        case 'Diezmo':
            return 'diezmo';
        case 'Ofrenda General':
            return 'ofrenda-general';
        case 'Pro-templo':
            return 'pro-templo';
        case 'Ofrenda Especial':
            return 'ofrenda-especial';
        default:
            return '';
    }
}

export function IncomePage() {
    const { data: incomes = [], isLoading, error } = useIncomes();
    const stats = useIncomeStats();
    const createIncome = useCreateIncome();
    const updateIncome = useUpdateIncome();
    const deleteIncome = useDeleteIncome();
    const { success, error: showError, confirm } = useNotification();
    const fundBalances = useFundBalances();

    const [filters, setFilters] = useState<FiltersState>(initialFilters);
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit';
        income: Income | null;
    }>({
        isOpen: false,
        mode: 'create',
        income: null,
    });

    // Filter incomes
    const filteredIncomes = useMemo(() => {
        return incomes.filter(income => {
            if (filters.category && income.category !== filters.category) {
                return false;
            }
            if (filters.startDate && income.date < filters.startDate) {
                return false;
            }
            if (filters.endDate && income.date > filters.endDate) {
                return false;
            }
            return true;
        });
    }, [incomes, filters]);

    // Calculate filtered total
    const filteredTotal = useMemo(() => {
        return filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
    }, [filteredIncomes]);

    const handleOpenModal = (mode: 'create' | 'edit', income: Income | null = null) => {
        setModalState({ isOpen: true, mode, income });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, mode: 'create', income: null });
    };

    const handleSaveIncome = async (data: IncomeFormData) => {
        try {
            if (modalState.mode === 'create') {
                await createIncome.mutateAsync({
                    amount: data.amount,
                    date: data.date,
                    category: data.category,
                    period: data.period || undefined,
                    member_id: data.member_id || undefined,
                    sector_id: data.sector_id || undefined,
                    notes: data.notes || undefined,
                });
                success('¡Ingreso registrado!', `Se registró un ingreso de ${formatCurrency(data.amount)}`);
            } else if (modalState.mode === 'edit' && modalState.income) {
                await updateIncome.mutateAsync({
                    id: modalState.income.id,
                    updates: {
                        amount: data.amount,
                        date: data.date,
                        category: data.category,
                        period: data.period || undefined,
                        member_id: data.member_id || undefined,
                        sector_id: data.sector_id || undefined,
                        notes: data.notes || undefined,
                    },
                });
                success('¡Ingreso actualizado!', 'Los cambios se guardaron correctamente.');
            }
            handleCloseModal();
        } catch (err) {
            console.error('Error saving income:', err);
            showError('Error al guardar', 'No se pudo guardar el ingreso. Intente nuevamente.');
        }
    };

    const handleDeleteIncome = async (income: Income) => {
        const confirmed = await confirm({
            title: '¿Eliminar ingreso?',
            message: `Esta acción eliminará el ingreso de ${formatCurrency(income.amount)} (${income.category}). Esta acción no se puede deshacer.`,
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            type: 'danger',
        });

        if (confirmed) {
            try {
                await deleteIncome.mutateAsync(income.id);
                success('Ingreso eliminado', 'El ingreso ha sido eliminado del sistema.');
            } catch (err) {
                console.error('Error deleting income:', err);
                showError('Error al eliminar', 'No se pudo eliminar el ingreso. Intente nuevamente.');
            }
        }
    };

    const handleClearFilters = () => {
        setFilters(initialFilters);
    };

    const handleExportExcel = () => {
        const exportData = filteredIncomes.map(income => ({
            fecha: formatDate(income.date),
            categoria: income.category,
            monto: income.amount,
            miembro: income.member?.full_name || '',
            sector: income.sector?.name || '',
            periodo: income.period || '',
        }));

        exportToExcel({
            filename: `Ingresos_${new Date().toISOString().split('T')[0]}`,
            columns: [
                { header: 'Fecha', key: 'fecha', width: 15 },
                { header: 'Categoría', key: 'categoria', width: 18 },
                { header: 'Monto ($)', key: 'monto', width: 12 },
                { header: 'Miembro', key: 'miembro', width: 25 },
                { header: 'Sector', key: 'sector', width: 15 },
                { header: 'Período', key: 'periodo', width: 15 },
            ],
            data: exportData,
        });
        success('¡Exportado!', 'El archivo Excel se ha descargado.');
    };

    const handleExportPDF = () => {
        const exportData = filteredIncomes.map(income => ({
            fecha: formatDate(income.date),
            categoria: income.category,
            monto: formatCurrency(income.amount),
            miembro: income.member?.full_name || '—',
            sector: income.sector?.name || '—',
            periodo: income.period || '—',
        }));

        exportToPDF({
            filename: `Ingresos_${new Date().toISOString().split('T')[0]}`,
            title: 'Reporte de Ingresos',
            subtitle: `Total: ${formatCurrency(filteredTotal)} | ${filteredIncomes.length} registros`,
            columns: [
                { header: 'Fecha', key: 'fecha', width: 30 },
                { header: 'Categoría', key: 'categoria', width: 35 },
                { header: 'Monto', key: 'monto', width: 25 },
                { header: 'Miembro', key: 'miembro', width: 45 },
                { header: 'Sector', key: 'sector', width: 30 },
                { header: 'Período', key: 'periodo', width: 30 },
            ],
            data: exportData,
        });
        success('¡Exportado!', 'El archivo PDF se ha descargado.');
    };

    if (error) {
        return (
            <div className="income-page">
                <div className="income-empty-state">
                    <div className="income-empty-icon">⚠️</div>
                    <h3>Error al cargar los ingresos</h3>
                    <p>Hubo un problema al obtener los datos. Por favor, intente nuevamente.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="income-page">
            {/* Header */}
            <header className="income-header">
                <h1>💰 Ingresos</h1>
                <p>Gestión de diezmos, ofrendas y donaciones</p>
            </header>

            {/* Stats Cards - Ingresos y Saldo Disponible */}
            <div className="income-stats-grid">
                <div className="income-stat-card total">
                    <div className="income-stat-icon">💵</div>
                    <div className="income-stat-amount" style={{ color: fundBalances.totalAvailable >= 0 ? '#10b981' : '#ef4444' }}>
                        {formatCurrency(fundBalances.totalAvailable)}
                    </div>
                    <div className="income-stat-label">Disponible</div>
                    <div className="income-stat-secondary">
                        Ingresado: {formatCurrency(fundBalances.totalIncome)}
                    </div>
                </div>
                <div className="income-stat-card diezmo">
                    <div className="income-stat-icon">📖</div>
                    <div className="income-stat-amount" style={{ color: fundBalances.getBalance('Diezmo') >= 0 ? '#10b981' : '#ef4444' }}>
                        {formatCurrency(fundBalances.getBalance('Diezmo'))}
                    </div>
                    <div className="income-stat-label">Diezmos Disponible</div>
                    <div className="income-stat-secondary">
                        Ingresado: {formatCurrency(stats.diezmos)}
                    </div>
                </div>
                <div className="income-stat-card ofrenda">
                    <div className="income-stat-icon">🙏</div>
                    <div className="income-stat-amount" style={{ color: (fundBalances.getBalance('Ofrenda General') + fundBalances.getBalance('Ofrenda Especial')) >= 0 ? '#10b981' : '#ef4444' }}>
                        {formatCurrency(fundBalances.getBalance('Ofrenda General') + fundBalances.getBalance('Ofrenda Especial'))}
                    </div>
                    <div className="income-stat-label">Ofrendas Disponible</div>
                    <div className="income-stat-secondary">
                        Ingresado: {formatCurrency(stats.ofrendas)}
                    </div>
                </div>
                <div className="income-stat-card protemplo">
                    <div className="income-stat-icon">🏛️</div>
                    <div className="income-stat-amount" style={{ color: fundBalances.getBalance('Pro-templo') >= 0 ? '#10b981' : '#ef4444' }}>
                        {formatCurrency(fundBalances.getBalance('Pro-templo'))}
                    </div>
                    <div className="income-stat-label">Pro-templo Disponible</div>
                    <div className="income-stat-secondary">
                        Ingresado: {formatCurrency(stats.proTemplo)}
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="income-actions-bar">
                <div className="income-filters">
                    <div className="income-filter-group">
                        <span className="income-filter-label">Categoría</span>
                        <select
                            className="income-filter-select"
                            value={filters.category ?? ''}
                            onChange={e => setFilters({ ...filters, category: e.target.value as IncomeCategory || null })}
                        >
                            <option value="">Todas</option>
                            {INCOME_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="income-filter-group">
                        <span className="income-filter-label">Desde</span>
                        <input
                            type="date"
                            className="income-filter-input"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div className="income-filter-group">
                        <span className="income-filter-label">Hasta</span>
                        <input
                            type="date"
                            className="income-filter-input"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    {(filters.category || filters.startDate || filters.endDate) && (
                        <button
                            className="clear-filters-btn"
                            onClick={handleClearFilters}
                            style={{ alignSelf: 'flex-end' }}
                        >
                            ✕ Limpiar
                        </button>
                    )}
                </div>
                <div className="export-buttons">
                    <button
                        className="export-btn excel"
                        onClick={handleExportExcel}
                        disabled={filteredIncomes.length === 0}
                        title="Exportar a Excel"
                    >
                        📊 Excel
                    </button>
                    <button
                        className="export-btn pdf"
                        onClick={handleExportPDF}
                        disabled={filteredIncomes.length === 0}
                        title="Exportar a PDF"
                    >
                        📄 PDF
                    </button>
                </div>
                <button
                    className="add-income-btn"
                    onClick={() => handleOpenModal('create')}
                >
                    <span>➕</span> Registrar Ingreso
                </button>
            </div>

            {/* Filtered Total */}
            {(filters.category || filters.startDate || filters.endDate) && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '0.5rem',
                    color: '#059669',
                    fontWeight: 500,
                }}>
                    Total filtrado: {formatCurrency(filteredTotal)} ({filteredIncomes.length} registros)
                </div>
            )}

            {/* Income Table */}
            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Cargando ingresos...</p>
                </div>
            ) : filteredIncomes.length === 0 ? (
                <div className="income-empty-state">
                    <div className="income-empty-icon">💰</div>
                    <h3>No hay ingresos registrados</h3>
                    <p>
                        {incomes.length === 0
                            ? 'Comienza registrando el primer ingreso.'
                            : 'No hay ingresos que coincidan con los filtros.'}
                    </p>
                </div>
            ) : (
                <div className="income-table-container">
                    <table className="income-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Categoría</th>
                                <th>Monto</th>
                                <th>Miembro</th>
                                <th>Sector</th>
                                <th>Período</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIncomes.map(income => (
                                <tr key={income.id}>
                                    <td>{formatDate(income.date)}</td>
                                    <td>
                                        <span className={`income-category-badge ${getCategoryClass(income.category)}`}>
                                            {income.category}
                                        </span>
                                    </td>
                                    <td className="income-amount">{formatCurrency(income.amount)}</td>
                                    <td>
                                        {income.member ? (
                                            <div className="income-member">
                                                <div className="income-member-avatar">
                                                    {income.member.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                                                </div>
                                                {income.member.full_name}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#94a3b8' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        {income.sector?.name || <span style={{ color: '#94a3b8' }}>—</span>}
                                    </td>
                                    <td>{income.period || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                                    <td>
                                        <div className="income-actions">
                                            <button
                                                className="income-action-btn edit"
                                                onClick={() => handleOpenModal('edit', income)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="income-action-btn delete"
                                                onClick={() => handleDeleteIncome(income)}
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            <IncomeModal
                isOpen={modalState.isOpen}
                mode={modalState.mode}
                income={modalState.income}
                onClose={handleCloseModal}
                onSave={handleSaveIncome}
                isLoading={createIncome.isPending || updateIncome.isPending}
            />
        </div>
    );
}

export default IncomePage;
