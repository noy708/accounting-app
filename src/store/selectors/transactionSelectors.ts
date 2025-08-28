import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Base selectors
export const selectTransactionState = (state: RootState) => state.transactions;
export const selectTransactions = (state: RootState) =>
  state.transactions.transactions;
export const selectCurrentTransaction = (state: RootState) =>
  state.transactions.currentTransaction;
export const selectTransactionLoading = (state: RootState) =>
  state.transactions.loading;
export const selectTransactionFilter = (state: RootState) =>
  state.transactions.filter;
export const selectTransactionPagination = (state: RootState) =>
  state.transactions.pagination;

// Memoized selectors
export const selectFilteredTransactions = createSelector(
  [selectTransactions, selectTransactionFilter],
  (transactions, filter) => {
    let filtered = [...transactions];

    if (filter.startDate) {
      filtered = filtered.filter((t) => new Date(t.date) >= filter.startDate!);
    }

    if (filter.endDate) {
      filtered = filtered.filter((t) => new Date(t.date) <= filter.endDate!);
    }

    if (filter.categoryId) {
      filtered = filtered.filter((t) => t.categoryId === filter.categoryId);
    }

    if (filter.type) {
      filtered = filtered.filter((t) => t.type === filter.type);
    }

    if (filter.minAmount !== undefined) {
      filtered = filtered.filter(
        (t) => Math.abs(t.amount) >= filter.minAmount!
      );
    }

    if (filter.maxAmount !== undefined) {
      filtered = filtered.filter(
        (t) => Math.abs(t.amount) <= filter.maxAmount!
      );
    }

    if (filter.description) {
      const searchTerm = filter.description.toLowerCase();
      filtered = filtered.filter((t) =>
        t.description.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }
);

export const selectPaginatedTransactions = createSelector(
  [selectFilteredTransactions, selectTransactionPagination],
  (transactions, pagination) => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return transactions.slice(startIndex, endIndex);
  }
);

export const selectTransactionsByType = createSelector(
  [selectTransactions],
  (transactions) => ({
    income: transactions.filter((t) => t.type === 'income'),
    expense: transactions.filter((t) => t.type === 'expense'),
  })
);

export const selectTransactionTotals = createSelector(
  [selectFilteredTransactions],
  (transactions) => {
    const totals = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.totalIncome += transaction.amount;
        } else {
          acc.totalExpense += Math.abs(transaction.amount);
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 }
    );

    return {
      ...totals,
      balance: totals.totalIncome - totals.totalExpense,
      count: transactions.length,
    };
  }
);

export const selectRecentTransactions = createSelector(
  [selectTransactions],
  (transactions) => {
    return [...transactions]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);
  }
);

export const selectTransactionById = (id: string) =>
  createSelector([selectTransactions], (transactions) =>
    transactions.find((t) => t.id === id)
  );
