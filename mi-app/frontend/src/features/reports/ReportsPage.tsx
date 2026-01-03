import { useState, useMemo } from 'react';
import { useIncomes, useIncomeStats } from '../income/hooks';
import { useExpenses, useExpensesStats } from '../expenses/hooks';
import { useMembers } from '../members/hooks';
import { exportToPDF } from '../../utils/export';
import { useNotification } from '../../components/ui';
import {
    ChartIcon,
    WalletIcon,
    MoneyIcon,
    TrendUpIcon,
    TrendDownIcon,
    UsersIcon,
    FileTextIcon,
    TrophyIcon
} from '../../components/ui/Icons';
import './reports.css';

type ReportPeriod = 'month' | 'quarter' | 'year' | 'custom';

interface DateRange {
    start: string;
    end: string;
}

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

function getMonthName(monthIndex: number): string {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex];
}

function getDateRangeForPeriod(period: ReportPeriod): DateRange {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    switch (period) {
        case 'month': {
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 0);
            return {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
            };
        }
        case 'quarter': {
            const quarterStart = Math.floor(month / 3) * 3;
            const start = new Date(year, quarterStart, 1);
            const end = new Date(year, quarterStart + 3, 0);
            return {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
            };
        }
        case 'year': {
            return {
                start: `${year}-01-01`,
                end: `${year}-12-31`,
            };
        }
        default:
            return {
                start: '',
                end: '',
            };
    }
}

export function ReportsPage() {
    const { data: incomes = [], isLoading: loadingIncomes } = useIncomes();
    const { data: expenses = [], isLoading: loadingExpenses } = useExpenses();
    const { data: members = [] } = useMembers();
    const incomeStats = useIncomeStats();
    const expenseStats = useExpensesStats();
    const { success } = useNotification();

    const [period, setPeriod] = useState<ReportPeriod>('month');
    const [customRange, setCustomRange] = useState<DateRange>({ start: '', end: '' });

    const isLoading = loadingIncomes || loadingExpenses;

    // Get date range based on selected period
    const dateRange = useMemo(() => {
        if (period === 'custom') {
            return customRange;
        }
        return getDateRangeForPeriod(period);
    }, [period, customRange]);

    // Filter data by date range
    const filteredIncomes = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return incomes;
        return incomes.filter(i => i.date >= dateRange.start && i.date <= dateRange.end);
    }, [incomes, dateRange]);

    const filteredExpenses = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return expenses;
        return expenses.filter(e => e.date >= dateRange.start && e.date <= dateRange.end);
    }, [expenses, dateRange]);

    // Calculate totals
    const totalIncome = useMemo(() =>
        filteredIncomes.reduce((sum, i) => sum + i.amount, 0),
        [filteredIncomes]
    );

    const totalExpenses = useMemo(() =>
        filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
        [filteredExpenses]
    );

    const balance = totalIncome - totalExpenses;

    // Income by category
    const incomeByCategory = useMemo(() => {
        const categories: Record<string, number> = {};
        filteredIncomes.forEach(i => {
            categories[i.category] = (categories[i.category] || 0) + i.amount;
        });
        return categories;
    }, [filteredIncomes]);

    // Expenses by category
    const expensesByCategory = useMemo(() => {
        const categories: Record<string, number> = {};
        filteredExpenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + e.amount;
        });
        return categories;
    }, [filteredExpenses]);

    // Monthly breakdown (for the year)
    const monthlyData = useMemo(() => {
        const data: { month: string; income: number; expenses: number; balance: number }[] = [];
        const year = new Date().getFullYear();

        for (let m = 0; m < 12; m++) {
            const monthStart = `${year}-${String(m + 1).padStart(2, '0')}-01`;
            const monthEnd = new Date(year, m + 1, 0).toISOString().split('T')[0];

            const monthIncome = incomes
                .filter(i => i.date >= monthStart && i.date <= monthEnd)
                .reduce((sum, i) => sum + i.amount, 0);

            const monthExpenses = expenses
                .filter(e => e.date >= monthStart && e.date <= monthEnd)
                .reduce((sum, e) => sum + e.amount, 0);

            data.push({
                month: getMonthName(m),
                income: monthIncome,
                expenses: monthExpenses,
                balance: monthIncome - monthExpenses,
            });
        }

        return data;
    }, [incomes, expenses]);

    // Top tithe contributors
    const topContributors = useMemo(() => {
        const contributors: Record<string, { name: string; total: number }> = {};

        filteredIncomes
            .filter(i => i.category === 'Diezmo' && i.member)
            .forEach(i => {
                const memberId = i.member_id!;
                if (!contributors[memberId]) {
                    contributors[memberId] = {
                        name: i.member!.full_name,
                        total: 0,
                    };
                }
                contributors[memberId].total += i.amount;
            });

        return Object.values(contributors)
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [filteredIncomes]);

    // Calculate max for bar chart scaling
    const maxMonthlyValue = useMemo(() => {
        return Math.max(
            ...monthlyData.map(d => Math.max(d.income, d.expenses)),
            1
        );
    }, [monthlyData]);

    const handleExportReport = () => {
        const reportData = [
            { concepto: 'Total Ingresos', monto: formatCurrency(totalIncome) },
            { concepto: 'Total Gastos', monto: formatCurrency(totalExpenses) },
            { concepto: 'Balance', monto: formatCurrency(balance) },
            { concepto: '', monto: '' },
            { concepto: '--- INGRESOS POR CATEGORÍA ---', monto: '' },
            ...Object.entries(incomeByCategory).map(([cat, amount]) => ({
                concepto: cat,
                monto: formatCurrency(amount),
            })),
            { concepto: '', monto: '' },
            { concepto: '--- GASTOS POR CATEGORÍA ---', monto: '' },
            ...Object.entries(expensesByCategory).map(([cat, amount]) => ({
                concepto: cat,
                monto: formatCurrency(amount),
            })),
        ];

        const periodLabel = period === 'custom'
            ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
            : period === 'month' ? 'Este Mes'
                : period === 'quarter' ? 'Este Trimestre'
                    : 'Este Año';

        exportToPDF({
            filename: `Reporte_Financiero_${new Date().toISOString().split('T')[0]}`,
            title: 'Reporte Financiero',
            subtitle: `Período: ${periodLabel}`,
            columns: [
                { header: 'Concepto', key: 'concepto', width: 120 },
                { header: 'Monto', key: 'monto', width: 60 },
            ],
            data: reportData,
        });

        success('¡Reporte exportado!', 'El archivo PDF se ha descargado.');
    };

    const getPeriodLabel = () => {
        switch (period) {
            case 'month': return 'Este Mes';
            case 'quarter': return 'Este Trimestre';
            case 'year': return 'Este Año';
            case 'custom': return dateRange.start && dateRange.end
                ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
                : 'Personalizado';
            default: return '';
        }
    };

    if (isLoading) {
        return (
            <div className="reports-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Cargando reportes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-page">
            {/* Header */}
            <header className="reports-header">
                <div className="reports-header-content">
                    <h1><ChartIcon size={28} /> Reportes</h1>
                    <p>Análisis financiero y estadísticas de la iglesia</p>
                </div>
                <button className="export-report-btn" onClick={handleExportReport}>
                    <FileTextIcon size={18} /> Exportar Reporte PDF
                </button>
            </header>

            {/* Period Selector */}
            <div className="reports-period-selector">
                <div className="period-tabs">
                    <button
                        className={`period-tab ${period === 'month' ? 'active' : ''}`}
                        onClick={() => setPeriod('month')}
                    >
                        Este Mes
                    </button>
                    <button
                        className={`period-tab ${period === 'quarter' ? 'active' : ''}`}
                        onClick={() => setPeriod('quarter')}
                    >
                        Trimestre
                    </button>
                    <button
                        className={`period-tab ${period === 'year' ? 'active' : ''}`}
                        onClick={() => setPeriod('year')}
                    >
                        Este Año
                    </button>
                    <button
                        className={`period-tab ${period === 'custom' ? 'active' : ''}`}
                        onClick={() => setPeriod('custom')}
                    >
                        Personalizado
                    </button>
                </div>

                {period === 'custom' && (
                    <div className="custom-date-range">
                        <div className="date-input-group">
                            <label>Desde</label>
                            <input
                                type="date"
                                value={customRange.start}
                                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                            />
                        </div>
                        <div className="date-input-group">
                            <label>Hasta</label>
                            <input
                                type="date"
                                value={customRange.end}
                                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <div className="reports-summary-grid">
                <div className="summary-card income">
                    <div className="summary-icon">
                        <WalletIcon size={32} color="#10b981" />
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">Ingresos</div>
                        <div className="summary-amount positive">{formatCurrency(totalIncome)}</div>
                        <div className="summary-count">{filteredIncomes.length} registros</div>
                    </div>
                </div>

                <div className="summary-card expenses">
                    <div className="summary-icon">
                        <MoneyIcon size={32} color="#ef4444" />
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">Gastos</div>
                        <div className="summary-amount negative">{formatCurrency(totalExpenses)}</div>
                        <div className="summary-count">{filteredExpenses.length} registros</div>
                    </div>
                </div>

                <div className="summary-card balance">
                    <div className="summary-icon">
                        {balance >= 0
                            ? <TrendUpIcon size={32} color="#10b981" />
                            : <TrendDownIcon size={32} color="#ef4444" />
                        }
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">Balance</div>
                        <div className={`summary-amount ${balance >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(balance)}
                        </div>
                        <div className="summary-count">{getPeriodLabel()}</div>
                    </div>
                </div>

                <div className="summary-card members">
                    <div className="summary-icon">
                        <UsersIcon size={32} color="#8b5cf6" />
                    </div>
                    <div className="summary-content">
                        <div className="summary-label">Miembros</div>
                        <div className="summary-amount">{members.filter(m => m.status === 'Activo').length}</div>
                        <div className="summary-count">activos de {members.length} total</div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="reports-charts-grid">
                {/* Income by Category */}
                <div className="chart-card">
                    <h3>Ingresos por Categoría</h3>
                    <div className="category-chart">
                        {Object.entries(incomeByCategory).length > 0 ? (
                            Object.entries(incomeByCategory).map(([category, amount]) => (
                                <div key={category} className="category-bar-row">
                                    <div className="category-label">{category}</div>
                                    <div className="category-bar-container">
                                        <div
                                            className="category-bar income-bar"
                                            style={{ width: `${(amount / totalIncome) * 100}%` }}
                                        />
                                    </div>
                                    <div className="category-amount">{formatCurrency(amount)}</div>
                                </div>
                            ))
                        ) : (
                            <div className="no-data">No hay datos para este período</div>
                        )}
                    </div>
                </div>

                {/* Expenses by Category */}
                <div className="chart-card">
                    <h3>Gastos por Categoría</h3>
                    <div className="category-chart">
                        {Object.entries(expensesByCategory).length > 0 ? (
                            Object.entries(expensesByCategory).map(([category, amount]) => (
                                <div key={category} className="category-bar-row">
                                    <div className="category-label">{category}</div>
                                    <div className="category-bar-container">
                                        <div
                                            className="category-bar expense-bar"
                                            style={{ width: `${(amount / totalExpenses) * 100}%` }}
                                        />
                                    </div>
                                    <div className="category-amount">{formatCurrency(amount)}</div>
                                </div>
                            ))
                        ) : (
                            <div className="no-data">No hay datos para este período</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Monthly Chart */}
            <div className="chart-card full-width">
                <h3>Resumen Mensual {new Date().getFullYear()}</h3>
                <div className="monthly-chart">
                    {monthlyData.map((data, index) => (
                        <div key={index} className="monthly-bar-group">
                            <div className="monthly-bars">
                                <div
                                    className="monthly-bar income-bar"
                                    style={{ height: `${(data.income / maxMonthlyValue) * 100}%` }}
                                    title={`Ingresos: ${formatCurrency(data.income)}`}
                                />
                                <div
                                    className="monthly-bar expense-bar"
                                    style={{ height: `${(data.expenses / maxMonthlyValue) * 100}%` }}
                                    title={`Gastos: ${formatCurrency(data.expenses)}`}
                                />
                            </div>
                            <div className="monthly-label">{data.month.slice(0, 3)}</div>
                        </div>
                    ))}
                </div>
                <div className="chart-legend">
                    <div className="legend-item">
                        <div className="legend-color income"></div>
                        <span>Ingresos</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-color expense"></div>
                        <span>Gastos</span>
                    </div>
                </div>
            </div>

            {/* Top Contributors & Quick Stats */}
            <div className="reports-details-grid">
                {/* Top Tithe Contributors */}
                <div className="details-card">
                    <h3><TrophyIcon size={20} /> Top Diezmadores</h3>
                    {topContributors.length > 0 ? (
                        <div className="contributors-list">
                            {topContributors.map((contributor, index) => (
                                <div key={index} className="contributor-row">
                                    <div className="contributor-rank">#{index + 1}</div>
                                    <div className="contributor-info">
                                        <div className="contributor-name">{contributor.name}</div>
                                        <div className="contributor-amount">{formatCurrency(contributor.total)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-data">No hay datos de diezmos en este período</div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="details-card">
                    <h3><ChartIcon size={20} /> Estadísticas Generales</h3>
                    <div className="quick-stats">
                        <div className="quick-stat-item">
                            <span className="stat-label">Promedio Ingreso Diario</span>
                            <span className="stat-value">
                                {formatCurrency(filteredIncomes.length > 0
                                    ? totalIncome / new Set(filteredIncomes.map(i => i.date)).size
                                    : 0
                                )}
                            </span>
                        </div>
                        <div className="quick-stat-item">
                            <span className="stat-label">Mayor Ingreso</span>
                            <span className="stat-value">
                                {formatCurrency(Math.max(...filteredIncomes.map(i => i.amount), 0))}
                            </span>
                        </div>
                        <div className="quick-stat-item">
                            <span className="stat-label">Mayor Gasto</span>
                            <span className="stat-value">
                                {formatCurrency(Math.max(...filteredExpenses.map(e => e.amount), 0))}
                            </span>
                        </div>
                        <div className="quick-stat-item">
                            <span className="stat-label">Diezmos Total</span>
                            <span className="stat-value">{formatCurrency(incomeStats.diezmos)}</span>
                        </div>
                        <div className="quick-stat-item">
                            <span className="stat-label">Ofrendas Total</span>
                            <span className="stat-value">{formatCurrency(incomeStats.ofrendas)}</span>
                        </div>
                        <div className="quick-stat-item">
                            <span className="stat-label">Pro-templo Total</span>
                            <span className="stat-value">{formatCurrency(incomeStats.proTemplo)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportsPage;
