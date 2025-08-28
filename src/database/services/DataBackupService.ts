import { Transaction, Category } from '../../types';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { DatabaseError } from '../connection';

export interface BackupData {
  version: string;
  timestamp: Date;
  metadata: {
    transactionCount: number;
    categoryCount: number;
    checksum: string;
  };
  transactions: Transaction[];
  categories: Category[];
}

export interface BackupOptions {
  includeTransactions: boolean;
  includeCategories: boolean;
  compress?: boolean;
}

export interface RestoreOptions {
  skipDuplicates: boolean;
  validateIntegrity: boolean;
  createMissingCategories: boolean;
}

export interface RestoreResult {
  success: boolean;
  transactions: {
    imported: number;
    skipped: number;
    errors: number;
  };
  categories: {
    imported: number;
    skipped: number;
    errors: number;
  };
  errors: string[];
}

export interface BackupProgress {
  current: number;
  total: number;
  stage: 'preparing' | 'backing_up' | 'complete';
  message: string;
}

export class DataBackupService {
  private transactionRepo: TransactionRepository;
  private categoryRepo: CategoryRepository;
  private autoBackupInterval: number | null = null;

  constructor() {
    this.transactionRepo = new TransactionRepository();
    this.categoryRepo = new CategoryRepository();
  }

  /**
   * 手動バックアップの実行
   */
  async createManualBackup(
    options: BackupOptions = {
      includeTransactions: true,
      includeCategories: true,
      compress: false,
    },
    onProgress?: (progress: BackupProgress) => void
  ): Promise<BackupData> {
    try {
      onProgress?.({
        current: 0,
        total: 100,
        stage: 'preparing',
        message: 'バックアップを準備中...',
      });

      const backupData = await this.generateBackupData(options, onProgress);

      onProgress?.({
        current: 100,
        total: 100,
        stage: 'complete',
        message: 'バックアップ完了',
      });

      return backupData;
    } catch (error) {
      throw new DatabaseError(
        `バックアップの作成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'database',
        true
      );
    }
  }

  /**
   * 自動バックアップの開始
   */
  startAutoBackup(intervalMinutes: number = 60): void {
    if (this.autoBackupInterval) {
      this.stopAutoBackup();
    }

    this.autoBackupInterval = window.setInterval(
      async () => {
        try {
          const backupData = await this.createManualBackup({
            includeTransactions: true,
            includeCategories: true,
            compress: true,
          });

          // 自動バックアップをローカルストレージに保存
          this.saveAutoBackupToStorage(backupData);
        } catch (error) {
          console.error('Auto backup failed:', error);
        }
      },
      intervalMinutes * 60 * 1000
    );

    console.log(`Auto backup started with ${intervalMinutes} minute interval`);
  }

  /**
   * 自動バックアップの停止
   */
  stopAutoBackup(): void {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
      console.log('Auto backup stopped');
    }
  }

  /**
   * バックアップファイルからのリストア
   */
  async restoreFromBackup(
    backupData: BackupData,
    options: RestoreOptions = {
      skipDuplicates: true,
      validateIntegrity: true,
      createMissingCategories: false,
    }
  ): Promise<RestoreResult> {
    const result: RestoreResult = {
      success: false,
      transactions: { imported: 0, skipped: 0, errors: 0 },
      categories: { imported: 0, skipped: 0, errors: 0 },
      errors: [],
    };

    try {
      // データ整合性チェック
      if (options.validateIntegrity) {
        const integrityCheck = await this.validateBackupIntegrity(backupData);
        if (!integrityCheck.isValid) {
          result.errors.push(...integrityCheck.errors);
          return result;
        }
      }

      // カテゴリを先にリストア
      if (backupData.categories && backupData.categories.length > 0) {
        const categoryResult = await this.restoreCategories(
          backupData.categories,
          options
        );
        result.categories = categoryResult;
      }

      // 取引をリストア
      if (backupData.transactions && backupData.transactions.length > 0) {
        const transactionResult = await this.restoreTransactions(
          backupData.transactions,
          options
        );
        result.transactions = transactionResult;
      }

      result.success = result.errors.length === 0;
      return result;
    } catch (error) {
      result.errors.push(
        `リストアに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return result;
    }
  }

  /**
   * バックアップデータの生成
   */
  private async generateBackupData(
    options: BackupOptions,
    onProgress?: (progress: BackupProgress) => void
  ): Promise<BackupData> {
    let transactions: Transaction[] = [];
    let categories: Category[] = [];
    let currentStep = 0;
    const totalSteps =
      (options.includeTransactions ? 1 : 0) +
      (options.includeCategories ? 1 : 0);

    // カテゴリの取得
    if (options.includeCategories) {
      onProgress?.({
        current: Math.round((currentStep / totalSteps) * 80),
        total: 100,
        stage: 'backing_up',
        message: 'カテゴリをバックアップ中...',
      });

      categories = await this.categoryRepo.getCategories();
      currentStep++;
    }

    // 取引の取得
    if (options.includeTransactions) {
      onProgress?.({
        current: Math.round((currentStep / totalSteps) * 80),
        total: 100,
        stage: 'backing_up',
        message: '取引をバックアップ中...',
      });

      transactions = await this.transactionRepo.getTransactions();
      currentStep++;
    }

    // チェックサムの計算
    onProgress?.({
      current: 90,
      total: 100,
      stage: 'backing_up',
      message: 'データ整合性チェックサムを計算中...',
    });

    const checksum = await this.calculateChecksum(transactions, categories);

    const backupData: BackupData = {
      version: '1.0.0',
      timestamp: new Date(),
      metadata: {
        transactionCount: transactions.length,
        categoryCount: categories.length,
        checksum,
      },
      transactions,
      categories,
    };

    return backupData;
  }

  /**
   * カテゴリのリストア
   */
  private async restoreCategories(
    categories: Category[],
    options: RestoreOptions
  ): Promise<{ imported: number; skipped: number; errors: number }> {
    const result = { imported: 0, skipped: 0, errors: 0 };
    const existingCategories = await this.categoryRepo.getCategories();
    const existingCategoryNames = new Set(
      existingCategories.map((c) => c.name.toLowerCase())
    );

    for (const category of categories) {
      try {
        // 重複チェック
        if (existingCategoryNames.has(category.name.toLowerCase())) {
          if (options.skipDuplicates) {
            result.skipped++;
            continue;
          }
        }

        // カテゴリを作成
        await this.categoryRepo.createCategory({
          name: category.name,
          color: category.color,
          type: category.type,
        });

        existingCategoryNames.add(category.name.toLowerCase());
        result.imported++;
      } catch (error) {
        console.error('Failed to restore category:', category.name, error);
        result.errors++;
      }
    }

    return result;
  }

  /**
   * 取引のリストア
   */
  private async restoreTransactions(
    transactions: Transaction[],
    options: RestoreOptions
  ): Promise<{ imported: number; skipped: number; errors: number }> {
    const result = { imported: 0, skipped: 0, errors: 0 };
    const existingTransactions = await this.transactionRepo.getTransactions();
    const existingCategories = await this.categoryRepo.getCategories();
    const categoryMap = new Map(existingCategories.map((c) => [c.name, c.id]));

    for (const transaction of transactions) {
      try {
        // 重複チェック（日付、金額、説明が同じ）
        const isDuplicate = existingTransactions.some(
          (t) =>
            t.date.toDateString() === transaction.date.toDateString() &&
            t.amount === transaction.amount &&
            t.description === transaction.description
        );

        if (isDuplicate && options.skipDuplicates) {
          result.skipped++;
          continue;
        }

        // カテゴリIDの解決
        let categoryId = transaction.categoryId;

        // カテゴリが存在しない場合の処理
        const categoryExists = existingCategories.some(
          (c) => c.id === categoryId
        );
        if (!categoryExists) {
          if (options.createMissingCategories) {
            // カテゴリ名からIDを検索（バックアップ時のカテゴリ名を使用）
            const backupCategory = transactions.find(
              (t) => t.categoryId === categoryId
            );
            if (backupCategory) {
              const foundCategoryId = Array.from(categoryMap.entries()).find(
                ([name]) => name.toLowerCase().includes('その他')
              )?.[1];

              if (foundCategoryId) {
                categoryId = foundCategoryId;
              } else {
                result.errors++;
                continue;
              }
            }
          } else {
            result.errors++;
            continue;
          }
        }

        // 取引を作成
        await this.transactionRepo.createTransaction({
          date: transaction.date,
          amount: Math.abs(transaction.amount), // 正の値で渡す
          description: transaction.description,
          categoryId,
          type: transaction.type,
        });

        result.imported++;
      } catch (error) {
        console.error(
          'Failed to restore transaction:',
          transaction.description,
          error
        );
        result.errors++;
      }
    }

    return result;
  }

  /**
   * バックアップデータの整合性チェック
   */
  async validateBackupIntegrity(backupData: BackupData): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // バージョンチェック
      if (!backupData.version) {
        errors.push('バックアップファイルにバージョン情報がありません');
      }

      // メタデータチェック
      if (!backupData.metadata) {
        errors.push('バックアップファイルにメタデータがありません');
      } else {
        // データ数の整合性チェック
        if (
          backupData.metadata.transactionCount !==
          backupData.transactions.length
        ) {
          errors.push('取引データ数がメタデータと一致しません');
        }

        if (
          backupData.metadata.categoryCount !== backupData.categories.length
        ) {
          errors.push('カテゴリデータ数がメタデータと一致しません');
        }

        // チェックサムの検証
        const calculatedChecksum = await this.calculateChecksum(
          backupData.transactions,
          backupData.categories
        );

        if (calculatedChecksum !== backupData.metadata.checksum) {
          errors.push(
            'データの整合性チェックに失敗しました（チェックサムが一致しません）'
          );
        }
      }

      // データ構造の基本チェック
      if (!Array.isArray(backupData.transactions)) {
        errors.push('取引データの形式が正しくありません');
      }

      if (!Array.isArray(backupData.categories)) {
        errors.push('カテゴリデータの形式が正しくありません');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          `整合性チェック中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
      };
    }
  }

  /**
   * チェックサムの計算
   */
  private async calculateChecksum(
    transactions: Transaction[],
    categories: Category[]
  ): Promise<string> {
    // 簡単なチェックサム計算（実際のプロダクションではより堅牢な方法を使用）
    const data = JSON.stringify({
      transactions: transactions.map((t) => ({
        date: t.date.toISOString(),
        amount: t.amount,
        description: t.description,
        categoryId: t.categoryId,
        type: t.type,
      })),
      categories: categories.map((c) => ({
        name: c.name,
        color: c.color,
        type: c.type,
        isDefault: c.isDefault,
      })),
    });

    // Simple hash function for checksum
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * 自動バックアップをローカルストレージに保存
   */
  private saveAutoBackupToStorage(backupData: BackupData): void {
    try {
      const backupKey = `auto_backup_${Date.now()}`;
      const compressedData = JSON.stringify(backupData);

      localStorage.setItem(backupKey, compressedData);

      // 古い自動バックアップを削除（最新5個まで保持）
      this.cleanupOldAutoBackups();
    } catch (error) {
      console.error('Failed to save auto backup to storage:', error);
    }
  }

  /**
   * 古い自動バックアップの削除
   */
  private cleanupOldAutoBackups(): void {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter((key) => key.startsWith('auto_backup_'))
        .sort()
        .reverse();

      // 最新5個を除いて削除
      backupKeys.slice(5).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to cleanup old auto backups:', error);
    }
  }

  /**
   * バックアップファイルのダウンロード
   */
  downloadBackup(backupData: BackupData, filename?: string): void {
    try {
      const timestamp = backupData.timestamp.toISOString().split('T')[0];
      const defaultFilename = `accounting_backup_${timestamp}.json`;
      const finalFilename = filename || defaultFilename;

      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = finalFilename;
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      throw new DatabaseError(
        `バックアップファイルのダウンロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * ローカルストレージから自動バックアップを取得
   */
  getAutoBackups(): BackupData[] {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter((key) => key.startsWith('auto_backup_'))
        .sort()
        .reverse();

      return backupKeys
        .map((key) => {
          const data = localStorage.getItem(key);
          if (data) {
            const backupData = JSON.parse(data);
            // 日付文字列をDateオブジェクトに変換
            backupData.timestamp = new Date(backupData.timestamp);
            backupData.transactions = backupData.transactions.map((t: any) => ({
              ...t,
              date: new Date(t.date),
              createdAt: new Date(t.createdAt),
              updatedAt: new Date(t.updatedAt),
            }));
            backupData.categories = backupData.categories.map((c: any) => ({
              ...c,
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt),
            }));
            return backupData;
          }
          return null;
        })
        .filter(Boolean) as BackupData[];
    } catch (error) {
      console.error('Failed to get auto backups:', error);
      return [];
    }
  }
}
