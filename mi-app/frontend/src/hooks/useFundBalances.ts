// Fund Balances Hook - Calculates available funds by income category
import { useIncomeStats } from '../features/income/hooks';
import { useExpensesStats } from '../features/expenses/hooks';
import type { IncomeCategory } from '../types/database';
import { INCOME_CATEGORIES } from '../types/database';

export interface FundBalance {
    category: IncomeCategory;
    income: number;
    spent: number;
    available: number;
}

export function useFundBalances() {
    const incomeStats = useIncomeStats();
    const expenseStats = useExpensesStats();

    const balances: FundBalance[] = INCOME_CATEGORIES.map(category => {
        let income = 0;

        // Map income categories
        if (category === 'Diezmo') {
            income = incomeStats.diezmos;
        } else if (category === 'Ofrenda General' || category === 'Ofrenda Especial') {
            // Split ofrendas into the two categories
            income = category === 'Ofrenda General'
                ? (incomeStats.byCategory['Ofrenda General'] || 0)
                : (incomeStats.byCategory['Ofrenda Especial'] || 0);
        } else if (category === 'Pro-templo') {
            income = incomeStats.proTemplo;
        }

        const spent = expenseStats.byFundingSource[category] || 0;
        const available = income - spent;

        return {
            category,
            income,
            spent,
            available,
        };
    });

    const totalIncome = incomeStats.total;
    const totalSpent = expenseStats.total;
    const totalAvailable = totalIncome - totalSpent;

    return {
        balances,
        totalIncome,
        totalSpent,
        totalAvailable,
        getBalance: (category: IncomeCategory) =>
            balances.find(b => b.category === category)?.available || 0,
    };
}
