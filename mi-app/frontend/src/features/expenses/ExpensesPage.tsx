import { useState, useMemo } from 'react';
import { useExpenses, useExpensesStats, useCreateExpense, useUpdateExpense, useDeleteExpense } from './hooks';
import { ExpenseModal, type ExpenseFormData } from './ExpenseModal';
import { useNotification } from '../../components/ui';
import { exportToExcel, exportToPDF } from '../../utils/export';
import { ReceiptIcon, MoneyIcon, LightbulbIcon, WrenchIcon, PackageIcon, SpreadsheetIcon, FileTextIcon, PlusIcon, EditIcon, TrashIcon } from '../../components/ui/Icons';
import type { Expense, ExpenseCategory } from '../../types/database';
import { EXPENSE_CATEGORIES } from '../../types/database';
import './expenses.css';
import '../members/members.css'; // Reuse modal styles

interface FiltersState {
    category: ExpenseCategory | null;
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

function getCategoryClass(category: ExpenseCategory): string {
    switch (category) {
        case 'Servicios Basicos':
            return 'servicios-basicos';
        case 'Mantenimiento':
            return 'mantenimiento';
        case 'Ayuda Social':
            return 'ayuda-social';
        case 'Limpieza':
            return 'limpieza';
        case 'Otros':
            return 'otros';
        default:
            return '';
    }
}

export function ExpensesPage() {
    const { data: expenses = [], isLoading, error } = useExpenses();
    const stats = useExpensesStats();
    const createExpense = useCreateExpense();
    const updateExpense = useUpdateExpense();
    const deleteExpense = useDeleteExpense();
    const { success, error: showError, confirm } = useNotification();

    const [filters, setFilters] = useState<FiltersState>(initialFilters);
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        mode: 'create' | 'edit';
        expense: Expense | null;
    }>({
        isOpen: false,
        mode: 'create',
        expense: null,
    });

    // Filter expenses
    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            if (filters.category && expense.category !== filters.category) {
                return false;
            }
            if (filters.startDate && expense.date < filters.startDate) {
                return false;
            }
            if (filters.endDate && expense.date > filters.endDate) {
                return false;
            }
            return true;
        });
    }, [expenses, filters]);

    // Calculate filtered total
    const filteredTotal = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    }, [filteredExpenses]);

    const handleOpenModal = (mode: 'create' | 'edit', expense: Expense | null = null) => {
        setModalState({ isOpen: true, mode, expense });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, mode: 'create', expense: null });
    };

    const handleSaveExpense = async (data: ExpenseFormData) => {
        try {
            if (modalState.mode === 'create') {
                await createExpense.mutateAsync({
                    amount: data.amount,
                    date: data.date,
                    category: data.category,
                    description: data.description,
                    funding_source: data.funding_source,
                });
                success('¡Gasto registrado!', `Se registró un gasto de ${formatCurrency(data.amount)} (de ${data.funding_source})`);
            } else if (modalState.mode === 'edit' && modalState.expense) {
                await updateExpense.mutateAsync({
                    id: modalState.expense.id,
                    updates: {
                        amount: data.amount,
                        date: data.date,
                        category: data.category,
                        description: data.description,
                        funding_source: data.funding_source,
                    },
                });
                success('¡Gasto actualizado!', 'Los cambios se guardaron correctamente.');
            }
            handleCloseModal();
        } catch (err) {
            console.error('Error saving expense:', err);
            showError('Error al guardar', 'No se pudo guardar el gasto. Intente nuevamente.');
        }
    };

    const handleDeleteExpense = async (expense: Expense) => {
        const confirmed = await confirm({
            title: '¿Eliminar gasto?',
            message: `Esta acción eliminará el gasto de ${formatCurrency(expense.amount)} (${expense.category}). Esta acción no se puede deshacer.`,
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            type: 'danger',
        });

        if (confirmed) {
            try {
                await deleteExpense.mutateAsync(expense.id);
                success('Gasto eliminado', 'El gasto ha sido eliminado del sistema.');
            } catch (err) {
                console.error('Error deleting expense:', err);
                showError('Error al eliminar', 'No se pudo eliminar el gasto. Intente nuevamente.');
            }
        }
    };

    const handleClearFilters = () => {
        setFilters(initialFilters);
    };

    const handleExportExcel = () => {
        const exportData = filteredExpenses.map(expense => ({
            fecha: formatDate(expense.date),
            categoria: expense.category,
            monto: expense.amount,
            fuente: expense.funding_source || '',
            descripcion: expense.description,
        }));

        exportToExcel({
            filename: `Gastos_${new Date().toISOString().split('T')[0]}`,
            columns: [
                { header: 'Fecha', key: 'fecha', width: 15 },
                { header: 'Categoría', key: 'categoria', width: 20 },
                { header: 'Monto ($)', key: 'monto', width: 12 },
                { header: 'Fuente de Fondos', key: 'fuente', width: 18 },
                { header: 'Descripción', key: 'descripcion', width: 40 },
            ],
            data: exportData,
        });
        success('¡Exportado!', 'El archivo Excel se ha descargado.');
    };

    const handleExportPDF = () => {
        const exportData = filteredExpenses.map(expense => ({
            fecha: formatDate(expense.date),
            categoria: expense.category,
            monto: formatCurrency(expense.amount),
            descripcion: expense.description.length > 50
                ? expense.description.slice(0, 50) + '...'
                : expense.description,
        }));

        exportToPDF({
            filename: `Gastos_${new Date().toISOString().split('T')[0]}`,
            title: 'Reporte de Gastos',
            subtitle: `Total: ${formatCurrency(filteredTotal)} | ${filteredExpenses.length} registros`,
            columns: [
                { header: 'Fecha', key: 'fecha', width: 30 },
                { header: 'Categoría', key: 'categoria', width: 40 },
                { header: 'Monto', key: 'monto', width: 25 },
                { header: 'Descripción', key: 'descripcion', width: 80 },
            ],
            data: exportData,
        });
        success('¡Exportado!', 'El archivo PDF se ha descargado.');
    };

    if (error) {
        return (
            <div className="expenses-page">
                <div className="expenses-empty-state">
                    <div className="expenses-empty-icon">⚠️</div>
                    <h3>Error al cargar los gastos</h3>
                    <p>Hubo un problema al obtener los datos. Por favor, intente nuevamente.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="expenses-page">
            {/* Header */}
            <header className="expenses-header">
                <h1><ReceiptIcon size={28} /> Gastos</h1>
                <p>Control de gastos y egresos de la iglesia</p>
            </header>

            {/* Stats Cards */}
            <div className="expenses-stats-grid">
                <div className="expense-stat-card total">
                    <div className="expense-stat-icon"><MoneyIcon size={28} color="#ef4444" /></div>
                    <div className="expense-stat-amount">{formatCurrency(stats.total)}</div>
                    <div className="expense-stat-label">Total Gastos</div>
                    <div className="expense-stat-count">{stats.count} registros</div>
                </div>
                <div className="expense-stat-card servicios">
                    <div className="expense-stat-icon"><LightbulbIcon size={28} color="#f59e0b" /></div>
                    <div className="expense-stat-amount">{formatCurrency(stats.byCategory['Servicios Basicos'] || 0)}</div>
                    <div className="expense-stat-label">Servicios</div>
                </div>
                <div className="expense-stat-card mantenimiento">
                    <div className="expense-stat-icon"><WrenchIcon size={28} color="#3b82f6" /></div>
                    <div className="expense-stat-amount">{formatCurrency(stats.byCategory['Mantenimiento'] || 0)}</div>
                    <div className="expense-stat-label">Mantenimiento</div>
                </div>
                <div className="expense-stat-card otros">
                    <div className="expense-stat-icon"><PackageIcon size={28} color="#6b7280" /></div>
                    <div className="expense-stat-amount">{formatCurrency(
                        (stats.byCategory['Ayuda Social'] || 0) +
                        (stats.byCategory['Limpieza'] || 0) +
                        (stats.byCategory['Otros'] || 0)
                    )}</div>
                    <div className="expense-stat-label">Otros</div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="expenses-actions-bar">
                <div className="expenses-filters">
                    <div className="expense-filter-group">
                        <span className="expense-filter-label">Categoría</span>
                        <select
                            className="expense-filter-select"
                            value={filters.category ?? ''}
                            onChange={e => setFilters({ ...filters, category: e.target.value as ExpenseCategory || null })}
                        >
                            <option value="">Todas</option>
                            {EXPENSE_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="expense-filter-group">
                        <span className="expense-filter-label">Desde</span>
                        <input
                            type="date"
                            className="expense-filter-input"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div className="expense-filter-group">
                        <span className="expense-filter-label">Hasta</span>
                        <input
                            type="date"
                            className="expense-filter-input"
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
                        disabled={filteredExpenses.length === 0}
                        title="Exportar a Excel"
                    >
                        <SpreadsheetIcon size={16} /> Excel
                    </button>
                    <button
                        className="export-btn pdf"
                        onClick={handleExportPDF}
                        disabled={filteredExpenses.length === 0}
                        title="Exportar a PDF"
                    >
                        <FileTextIcon size={16} /> PDF
                    </button>
                </div>
                <button
                    className="add-expense-btn"
                    onClick={() => handleOpenModal('create')}
                >
                    <PlusIcon size={18} /> Registrar Gasto
                </button>
            </div>

            {/* Filtered Total */}
            {(filters.category || filters.startDate || filters.endDate) && (
                <div style={{
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '0.5rem',
                    color: '#dc2626',
                    fontWeight: 500,
                }}>
                    Total filtrado: {formatCurrency(filteredTotal)} ({filteredExpenses.length} registros)
                </div>
            )}

            {/* Expenses Table */}
            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Cargando gastos...</p>
                </div>
            ) : filteredExpenses.length === 0 ? (
                <div className="expenses-empty-state">
                    <div className="expenses-empty-icon"><ReceiptIcon size={48} color="#94a3b8" /></div>
                    <h3>No hay gastos registrados</h3>
                    <p>
                        {expenses.length === 0
                            ? 'Comienza registrando el primer gasto.'
                            : 'No hay gastos que coincidan con los filtros.'}
                    </p>
                </div>
            ) : (
                <div className="expenses-table-container">
                    <table className="expenses-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Categoría</th>
                                <th>Monto</th>
                                <th>Fuente</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map(expense => (
                                <tr key={expense.id}>
                                    <td>{formatDate(expense.date)}</td>
                                    <td>
                                        <span className={`expense-category-badge ${getCategoryClass(expense.category)}`}>
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="expense-amount">{formatCurrency(expense.amount)}</td>
                                    <td>
                                        {expense.funding_source ? (
                                            <span className="funding-source-badge">
                                                {expense.funding_source}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#94a3b8' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        {expense.description.length > 40 ? (
                                            <span title={expense.description}>
                                                {expense.description.slice(0, 40)}...
                                            </span>
                                        ) : (
                                            expense.description
                                        )}
                                    </td>
                                    <td>
                                        <div className="expense-actions">
                                            <button
                                                className="expense-action-btn edit"
                                                onClick={() => handleOpenModal('edit', expense)}
                                                title="Editar"
                                            >
                                                <EditIcon size={16} />
                                            </button>
                                            <button
                                                className="expense-action-btn delete"
                                                onClick={() => handleDeleteExpense(expense)}
                                                title="Eliminar"
                                            >
                                                <TrashIcon size={16} />
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
            <ExpenseModal
                isOpen={modalState.isOpen}
                mode={modalState.mode}
                expense={modalState.expense}
                onClose={handleCloseModal}
                onSave={handleSaveExpense}
                isLoading={createExpense.isPending || updateExpense.isPending}
            />
        </div>
    );
}

export default ExpensesPage;
