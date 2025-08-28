import { Transaction, Category, TransactionFilter } from '../../types';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';

export interface ExportOptions {
  includeTransactions: boolean;
  includeCategories: boolean;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  categoryIds?: string[];
}

export interface ExportProgress {
  current: number;
  total: number;
  stage: 'preparing' | 'exporting' | 'complete';
  message: string;
}

export class DataExportService {
  private transactionRepo: TransactionRepository;
  private categoryRepo: CategoryRepository;

  constructor() {
    this.transactionRepo = new TransactionRepository();
    this.categoryRepo = new CategoryRepository();
  }

  async exportToCSV(
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<{ transactions?: string; categories?: string }> {
    const result: { transactions?: string; categories?: string } = {};
    let totalSteps = 0;
    let currentStep = 0;

    // Calculate total steps
    if (options.includeTransactions) totalSteps++;
    if (options.includeCategories) totalSteps++;

    onProgress?.({
      current: 0,
      total: totalSteps,
      stage: 'preparing',
      message: 'エクスポートを準備中...',
    });

    try {
      // Export categories first if requested
      if (options.includeCategories) {
        onProgress?.({
          current: currentStep,
          total: totalSteps,
          stage: 'exporting',
          message: 'カテゴリをエクスポート中...',
        });

        const categories = await this.categoryRepo.getCategories();
        result.categories = this.generateCategoriesCSV(categories);
        currentStep++;
      }

      // Export transactions if requested
      if (options.includeTransactions) {
        onProgress?.({
          current: currentStep,
          total: totalSteps,
          stage: 'exporting',
          message: '取引をエクスポート中...',
        });

        const filter: TransactionFilter = {};
        if (options.dateRange) {
          filter.startDate = options.dateRange.startDate;
          filter.endDate = options.dateRange.endDate;
        }

        const transactions = await this.transactionRepo.getTransactions(filter);

        // Filter by category if specified
        const filteredTransactions = options.categoryIds?.length
          ? transactions.filter((t) =>
            options.categoryIds!.includes(t.categoryId)
          )
          : transactions;

        // Get categories for lookup
        const categories = await this.categoryRepo.getCategories();
        const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

        result.transactions = this.generateTransactionsCSV(
          filteredTransactions,
          categoryMap
        );
        currentStep++;
      }

      onProgress?.({
        current: totalSteps,
        total: totalSteps,
        stage: 'complete',
        message: 'エクスポート完了',
      });

      return result;
    } catch (error) {
      throw new Error(
        `エクスポートに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private generateTransactionsCSV(
    transactions: Transaction[],
    categoryMap: Map<string, string>
  ): string {
    const headers = [
      '日付',
      '金額',
      '種類',
      'カテゴリ',
      '説明',
      '作成日時',
      '更新日時',
    ];

    const rows = transactions.map((transaction) => [
      this.formatDate(transaction.date),
      transaction.amount.toString(),
      transaction.type === 'income' ? '収入' : '支出',
      categoryMap.get(transaction.categoryId) || 'Unknown',
      `"${transaction.description.replace(/"/g, '""')}"`, // Escape quotes
      this.formatDateTime(transaction.createdAt),
      this.formatDateTime(transaction.updatedAt),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  private generateCategoriesCSV(categories: Category[]): string {
    const headers = [
      'カテゴリ名',
      '色',
      '種類',
      'デフォルト',
      '作成日時',
      '更新日時',
    ];

    const rows = categories.map((category) => [
      `"${category.name.replace(/"/g, '""')}"`, // Escape quotes
      category.color,
      category.type === 'income'
        ? '収入'
        : category.type === 'expense'
          ? '支出'
          : '両方',
      category.isDefault ? 'はい' : 'いいえ',
      this.formatDateTime(category.createdAt),
      this.formatDateTime(category.updatedAt),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  downloadCSV(content: string, filename: string): void {
    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}
