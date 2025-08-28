// Core data models for the accounting app

export interface Transaction {
  id: string;
  date: Date;
  amount: number; // 正の値：収入、負の値：支出
  description: string;
  categoryId: string;
  type: 'income' | 'expense';
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: CategorySummary[];
  transactionCount: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface YearlyReport {
  year: number;
  monthlyData: MonthlyReport[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

// DTOs for API operations
export interface CreateTransactionDto {
  date: Date;
  amount: number;
  description: string;
  categoryId: string;
  type: 'income' | 'expense';
}

export interface UpdateTransactionDto {
  date?: Date;
  amount?: number;
  description?: string;
  categoryId?: string;
  type?: 'income' | 'expense';
}

export interface CreateCategoryDto {
  name: string;
  color: string;
  type: 'income' | 'expense' | 'both';
}

export interface UpdateCategoryDto {
  name?: string;
  color?: string;
  type?: 'income' | 'expense' | 'both';
}

// Filter and search interfaces
export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  type?: 'income' | 'expense';
  minAmount?: number;
  maxAmount?: number;
  description?: string;
}

// Error handling
export interface ErrorState {
  message: string;
  type: 'validation' | 'database' | 'business' | 'system';
  field?: string; // バリデーションエラーの場合
  retryable: boolean;
}

// Edit history for transactions
export interface TransactionHistory {
  id: string;
  transactionId: string;
  action: 'create' | 'update' | 'delete';
  previousData?: Partial<Transaction>;
  newData?: Partial<Transaction>;
  timestamp: Date;
  changes?: string[]; // Array of field names that were changed
}

// UI State interfaces
export interface LoadingState {
  isLoading: boolean;
  operation?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
