// Report service for generating monthly, category, and yearly reports
import { db } from '../schema';
import { DatabaseError } from '../connection';
import {
  MonthlyReport,
  CategorySummary,
  YearlyReport,
  Transaction,
  Category,
  TransactionFilter,
} from '../../types';
import { transactionRepository } from '../repositories/TransactionRepository';

export class ReportService {
  /**
   * 月次レポートを生成
   */
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    try {
      // 指定月の開始日と終了日を計算
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // 指定期間の取引を取得
      const filter: TransactionFilter = {
        startDate,
        endDate,
      };

      const transactions = await transactionRepository.getTransactions(filter);
      
      // 基本統計を計算
      const stats = this.calculateBasicStats(transactions);
      
      // カテゴリ別集計を計算
      const categoryBreakdown = await this.calculateCategoryBreakdown(transactions);

      return {
        year,
        month,
        totalIncome: stats.totalIncome,
        totalExpense: stats.totalExpense,
        balance: stats.balance,
        categoryBreakdown,
        transactionCount: transactions.length,
      };
    } catch (error) {
      console.error('Failed to generate monthly report:', error);
      throw new DatabaseError('月次レポートの生成に失敗しました', 'database', true);
    }
  }

  /**
   * カテゴリ別レポートを生成
   */
  async getCategoryReport(startDate: Date, endDate: Date): Promise<CategorySummary[]> {
    try {
      const filter: TransactionFilter = {
        startDate,
        endDate,
      };

      const transactions = await transactionRepository.getTransactions(filter);
      return await this.calculateCategoryBreakdown(transactions);
    } catch (error) {
      console.error('Failed to generate category report:', error);
      throw new DatabaseError('カテゴリ別レポートの生成に失敗しました', 'database', true);
    }
  }

  /**
   * 年次レポートを生成
   */
  async getYearlyReport(year: number): Promise<YearlyReport> {
    try {
      const monthlyData: MonthlyReport[] = [];
      let totalIncome = 0;
      let totalExpense = 0;

      // 各月のレポートを生成
      for (let month = 1; month <= 12; month++) {
        const monthlyReport = await this.getMonthlyReport(year, month);
        monthlyData.push(monthlyReport);
        totalIncome += monthlyReport.totalIncome;
        totalExpense += monthlyReport.totalExpense;
      }

      return {
        year,
        monthlyData,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      };
    } catch (error) {
      console.error('Failed to generate yearly report:', error);
      throw new DatabaseError('年次レポートの生成に失敗しました', 'database', true);
    }
  }

  /**
   * 基本統計を計算
   */
  private calculateBasicStats(transactions: Transaction[]): {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  } {
    const stats = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.totalIncome += Math.abs(transaction.amount);
        } else {
          acc.totalExpense += Math.abs(transaction.amount);
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 }
    );

    stats.balance = stats.totalIncome - stats.totalExpense;
    return stats;
  }

  /**
   * カテゴリ別集計を計算
   */
  private async calculateCategoryBreakdown(transactions: Transaction[]): Promise<CategorySummary[]> {
    try {
      // カテゴリ情報を取得
      const categories = await db.categories.toArray();
      const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

      // カテゴリ別に取引を集計
      const categoryStats = new Map<string, {
        amount: number;
        transactionCount: number;
        category: Category;
      }>();

      transactions.forEach(transaction => {
        const category = categoryMap.get(transaction.categoryId);
        if (!category) return;

        const existing = categoryStats.get(transaction.categoryId) || {
          amount: 0,
          transactionCount: 0,
          category,
        };

        existing.amount += Math.abs(transaction.amount);
        existing.transactionCount += 1;
        categoryStats.set(transaction.categoryId, existing);
      });

      // 総支出を計算（割合計算用）
      const totalAmount = Array.from(categoryStats.values())
        .reduce((sum, stat) => sum + stat.amount, 0);

      // CategorySummary配列を生成
      const categoryBreakdown: CategorySummary[] = Array.from(categoryStats.entries())
        .map(([categoryId, stats]) => ({
          categoryId,
          categoryName: stats.category.name,
          amount: stats.amount,
          percentage: totalAmount > 0 ? (stats.amount / totalAmount) * 100 : 0,
          transactionCount: stats.transactionCount,
        }))
        .sort((a, b) => b.amount - a.amount); // 金額の多い順にソート

      return categoryBreakdown;
    } catch (error) {
      console.error('Failed to calculate category breakdown:', error);
      throw new DatabaseError('カテゴリ別集計の計算に失敗しました', 'database', true);
    }
  }

  /**
   * 指定期間の日別統計を取得（グラフ表示用）
   */
  async getDailyStats(startDate: Date, endDate: Date): Promise<Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>> {
    try {
      const filter: TransactionFilter = {
        startDate,
        endDate,
      };

      const transactions = await transactionRepository.getTransactions(filter);
      
      // 日別に取引を集計
      const dailyStats = new Map<string, {
        income: number;
        expense: number;
      }>();

      transactions.forEach(transaction => {
        const dateKey = transaction.date.toISOString().split('T')[0];
        const existing = dailyStats.get(dateKey) || { income: 0, expense: 0 };

        if (transaction.type === 'income') {
          existing.income += Math.abs(transaction.amount);
        } else {
          existing.expense += Math.abs(transaction.amount);
        }

        dailyStats.set(dateKey, existing);
      });

      // 結果を配列に変換してソート
      return Array.from(dailyStats.entries())
        .map(([date, stats]) => ({
          date,
          income: stats.income,
          expense: stats.expense,
          balance: stats.income - stats.expense,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Failed to get daily stats:', error);
      throw new DatabaseError('日別統計の取得に失敗しました', 'database', true);
    }
  }
}

// シングルトンインスタンス
export const reportService = new ReportService();