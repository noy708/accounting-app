// Service interfaces for the accounting app

import {
  Transaction,
  Category,
  MonthlyReport,
  YearlyReport,
  CategorySummary,
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  TransactionFilter,
} from './index';

export interface TransactionService {
  createTransaction(transaction: CreateTransactionDto): Promise<Transaction>;
  updateTransaction(
    id: string,
    transaction: UpdateTransactionDto
  ): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  getTransactions(filter?: TransactionFilter): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction>;
}

export interface CategoryService {
  createCategory(category: CreateCategoryDto): Promise<Category>;
  updateCategory(id: string, category: UpdateCategoryDto): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category>;
}

export interface ReportService {
  getMonthlyReport(year: number, month: number): Promise<MonthlyReport>;
  getCategoryReport(startDate: Date, endDate: Date): Promise<CategorySummary[]>;
  getYearlyReport(year: number): Promise<YearlyReport>;
}

export interface DataService {
  exportData(): Promise<string>; // CSV形式
  importData(csvData: string): Promise<void>;
  backupData(): Promise<string>;
  restoreData(backupData: string): Promise<void>;
}
