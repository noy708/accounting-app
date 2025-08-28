// Transaction repository implementation with CRUD operations, search, and validation
import { db } from '../schema';
import { DatabaseError } from '../connection';
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFilter,
} from '../../types';
import { TransactionService } from '../../types/services';
import { transactionHistoryService } from '../services/TransactionHistoryService';

export class TransactionRepository implements TransactionService {
  /**
   * 新しい取引を作成
   */
  async createTransaction(
    transactionDto: CreateTransactionDto
  ): Promise<Transaction> {
    try {
      // バリデーション
      this.validateTransactionDto(transactionDto);

      // カテゴリの存在確認
      await this.validateCategoryExists(transactionDto.categoryId);

      const now = new Date();
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        ...transactionDto,
        // 金額の符号を取引タイプに応じて調整
        amount:
          transactionDto.type === 'expense'
            ? Math.abs(transactionDto.amount) * -1
            : Math.abs(transactionDto.amount),
        createdAt: now,
        updatedAt: now,
      };

      await db.transactions.add(transaction);

      // Record creation history
      await transactionHistoryService.recordHistory(
        transaction.id,
        'create',
        undefined,
        transaction
      );

      return transaction;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Failed to create transaction:', error);
      throw new DatabaseError('取引の作成に失敗しました', 'database', true);
    }
  }

  /**
   * 取引を更新
   */
  async updateTransaction(
    id: string,
    updateDto: UpdateTransactionDto
  ): Promise<Transaction> {
    try {
      // 既存の取引を取得
      const existingTransaction = await this.getTransactionById(id);

      // 更新データのバリデーション
      if (updateDto.categoryId) {
        await this.validateCategoryExists(updateDto.categoryId);
      }

      // 部分的なバリデーション
      this.validatePartialTransactionDto(updateDto);

      // 更新データを準備
      const updatedData: Partial<Transaction> = {
        ...updateDto,
        updatedAt: new Date(),
      };

      // 金額とタイプが更新される場合の符号調整
      if (updateDto.amount !== undefined || updateDto.type !== undefined) {
        const newType = updateDto.type || existingTransaction.type;
        const newAmount =
          updateDto.amount !== undefined
            ? updateDto.amount
            : Math.abs(existingTransaction.amount);

        updatedData.amount =
          newType === 'expense'
            ? Math.abs(newAmount) * -1
            : Math.abs(newAmount);
      }

      await db.transactions.update(id, updatedData);

      // Record update history
      await transactionHistoryService.recordHistory(
        id,
        'update',
        existingTransaction,
        updatedData
      );

      // 更新された取引を返す
      return await this.getTransactionById(id);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Failed to update transaction:', error);
      throw new DatabaseError('取引の更新に失敗しました', 'database', true);
    }
  }

  /**
   * 取引を削除
   */
  async deleteTransaction(id: string): Promise<void> {
    try {
      // 取引の存在確認
      await this.getTransactionById(id);

      // Get transaction data before deletion for history
      const existingTransaction = await this.getTransactionById(id);

      await db.transactions.delete(id);

      // Record deletion history
      await transactionHistoryService.recordHistory(
        id,
        'delete',
        existingTransaction,
        undefined
      );
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Failed to delete transaction:', error);
      throw new DatabaseError('取引の削除に失敗しました', 'database', true);
    }
  }

  /**
   * フィルター条件に基づいて取引を取得
   */
  async getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
    try {
      let query = db.transactions.orderBy('date').reverse(); // 新しい順

      if (filter) {
        // 日付範囲フィルター
        if (filter.startDate || filter.endDate) {
          query = query.filter((transaction) => {
            const transactionDate = new Date(transaction.date);

            if (filter.startDate) {
              const startDate = new Date(filter.startDate);
              startDate.setHours(0, 0, 0, 0);
              if (transactionDate < startDate) {
                return false;
              }
            }

            if (filter.endDate) {
              const endDate = new Date(filter.endDate);
              endDate.setHours(23, 59, 59, 999);
              if (transactionDate > endDate) {
                return false;
              }
            }

            return true;
          });
        }

        // カテゴリフィルター
        if (filter.categoryId) {
          query = query.filter(
            (transaction) => transaction.categoryId === filter.categoryId
          );
        }

        // 取引タイプフィルター
        if (filter.type) {
          query = query.filter(
            (transaction) => transaction.type === filter.type
          );
        }

        // 金額範囲フィルター
        if (filter.minAmount !== undefined || filter.maxAmount !== undefined) {
          query = query.filter((transaction) => {
            const absoluteAmount = Math.abs(transaction.amount);

            if (
              filter.minAmount !== undefined &&
              absoluteAmount < filter.minAmount
            ) {
              return false;
            }

            if (
              filter.maxAmount !== undefined &&
              absoluteAmount > filter.maxAmount
            ) {
              return false;
            }

            return true;
          });
        }

        // 説明文検索フィルター
        if (filter.description) {
          const searchTerm = filter.description.toLowerCase();
          query = query.filter((transaction) =>
            transaction.description.toLowerCase().includes(searchTerm)
          );
        }
      }

      const transactions = await query.toArray();
      return transactions.map((t) => this.normalizeTransaction(t));
    } catch (error) {
      console.error('Failed to get transactions:', error);
      throw new DatabaseError('取引の取得に失敗しました', 'database', true);
    }
  }

  /**
   * IDで取引を取得
   */
  async getTransactionById(id: string): Promise<Transaction> {
    try {
      const transaction = await db.transactions.get(id);

      if (!transaction) {
        throw new DatabaseError('取引が見つかりません', 'business');
      }

      return this.normalizeTransaction(transaction);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Failed to get transaction by ID:', error);
      throw new DatabaseError('取引の取得に失敗しました', 'database', true);
    }
  }

  /**
   * 取引データの完全バリデーション
   */
  private validateTransactionDto(dto: CreateTransactionDto): void {
    const errors: string[] = [];

    // 必須フィールドのチェック
    if (!dto.date) {
      errors.push('日付は必須です');
    }

    if (dto.amount === undefined || dto.amount === null) {
      errors.push('金額は必須です');
    }

    if (!dto.categoryId) {
      errors.push('カテゴリは必須です');
    }

    if (!dto.type) {
      errors.push('取引タイプは必須です');
    }

    // 金額のバリデーション
    if (dto.amount !== undefined && dto.amount !== null) {
      if (typeof dto.amount !== 'number' || isNaN(dto.amount)) {
        errors.push('金額は数値である必要があります');
      } else if (dto.amount === 0) {
        errors.push('金額は0より大きい値である必要があります');
      } else if (dto.amount < 0) {
        errors.push('金額は正の値で入力してください');
      }
    }

    // 日付のバリデーション
    if (dto.date) {
      const date = new Date(dto.date);
      if (isNaN(date.getTime())) {
        errors.push('有効な日付を入力してください');
      }

      // 未来の日付チェック（1日の余裕を持たせる）
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (date > tomorrow) {
        errors.push('未来の日付は入力できません');
      }
    }

    // 取引タイプのバリデーション
    if (dto.type && !['income', 'expense'].includes(dto.type)) {
      errors.push('取引タイプは収入または支出である必要があります');
    }

    // 説明文のバリデーション
    if (dto.description !== undefined) {
      if (typeof dto.description !== 'string') {
        errors.push('説明文は文字列である必要があります');
      } else if (dto.description.length > 500) {
        errors.push('説明文は500文字以内で入力してください');
      }
    }

    if (errors.length > 0) {
      throw new DatabaseError(
        `バリデーションエラー: ${errors.join(', ')}`,
        'validation'
      );
    }
  }

  /**
   * 部分更新用のバリデーション
   */
  private validatePartialTransactionDto(dto: UpdateTransactionDto): void {
    const errors: string[] = [];

    // 金額のバリデーション（提供された場合のみ）
    if (dto.amount !== undefined) {
      if (typeof dto.amount !== 'number' || isNaN(dto.amount)) {
        errors.push('金額は数値である必要があります');
      } else if (dto.amount === 0) {
        errors.push('金額は0より大きい値である必要があります');
      } else if (dto.amount < 0) {
        errors.push('金額は正の値で入力してください');
      }
    }

    // 日付のバリデーション（提供された場合のみ）
    if (dto.date !== undefined) {
      const date = new Date(dto.date);
      if (isNaN(date.getTime())) {
        errors.push('有効な日付を入力してください');
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (date > tomorrow) {
        errors.push('未来の日付は入力できません');
      }
    }

    // 取引タイプのバリデーション（提供された場合のみ）
    if (dto.type !== undefined && !['income', 'expense'].includes(dto.type)) {
      errors.push('取引タイプは収入または支出である必要があります');
    }

    // 説明文のバリデーション（提供された場合のみ）
    if (dto.description !== undefined) {
      if (typeof dto.description !== 'string') {
        errors.push('説明文は文字列である必要があります');
      } else if (dto.description.length > 500) {
        errors.push('説明文は500文字以内で入力してください');
      }
    }

    if (errors.length > 0) {
      throw new DatabaseError(
        `バリデーションエラー: ${errors.join(', ')}`,
        'validation'
      );
    }
  }

  /**
   * カテゴリの存在確認
   */
  private async validateCategoryExists(categoryId: string): Promise<void> {
    try {
      const category = await db.categories.get(categoryId);
      if (!category) {
        throw new DatabaseError(
          '指定されたカテゴリが見つかりません',
          'business'
        );
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('カテゴリの確認に失敗しました', 'database', true);
    }
  }

  /**
   * 取引データの正規化（日付をDateオブジェクトに変換）
   */
  private normalizeTransaction(transaction: any): Transaction {
    return {
      ...transaction,
      date: new Date(transaction.date),
      createdAt: new Date(transaction.createdAt),
      updatedAt: new Date(transaction.updatedAt),
    };
  }

  /**
   * 統計情報の取得（レポート機能で使用）
   */
  async getTransactionStats(filter?: TransactionFilter): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    count: number;
  }> {
    try {
      const transactions = await this.getTransactions(filter);

      const stats = transactions.reduce(
        (acc, transaction) => {
          if (transaction.type === 'income') {
            acc.totalIncome += Math.abs(transaction.amount);
          } else {
            acc.totalExpense += Math.abs(transaction.amount);
          }
          acc.count++;
          return acc;
        },
        { totalIncome: 0, totalExpense: 0, balance: 0, count: 0 }
      );

      stats.balance = stats.totalIncome - stats.totalExpense;

      return stats;
    } catch (error) {
      console.error('Failed to get transaction stats:', error);
      throw new DatabaseError('統計情報の取得に失敗しました', 'database', true);
    }
  }
}

// シングルトンインスタンス
export const transactionRepository = new TransactionRepository();
