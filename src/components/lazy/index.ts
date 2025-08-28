import { lazy } from 'react';

// Lazy load main feature components
export const LazyDashboard = lazy(() => import('../dashboard/Dashboard'));
export const LazyTransactionList = lazy(
  () => import('../transactions/TransactionList')
);
export const LazyTransactionForm = lazy(
  () => import('../transactions/TransactionForm')
);
export const LazyCategoryManager = lazy(
  () => import('../categories/CategoryManager')
);
export const LazyMonthlyReport = lazy(() => import('../reports/MonthlyReport'));
export const LazyCategoryReport = lazy(
  () => import('../reports/CategoryReport')
);
export const LazyYearlyReport = lazy(() => import('../reports/YearlyReport'));
export const LazyDataExport = lazy(() => import('../data/DataExport'));
export const LazyDataImport = lazy(() => import('../data/DataImport'));
export const LazyDataBackup = lazy(() => import('../data/DataBackup'));
