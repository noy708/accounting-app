// Database connection utilities and error handling
import { db } from './schema';
import { ErrorState } from '../types';

export class DatabaseError extends Error {
  public readonly type: ErrorState['type'];
  public readonly retryable: boolean;

  constructor(
    message: string,
    type: ErrorState['type'] = 'database',
    retryable = false
  ) {
    super(message);
    this.name = 'DatabaseError';
    this.type = type;
    this.retryable = retryable;
  }
}

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * テスト用：インスタンスをリセット
   */
  public static resetInstance(): void {
    if (DatabaseConnection.instance) {
      DatabaseConnection.instance.isInitialized = false;
    }
  }

  /**
   * データベース接続を初期化
   */
  public async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // データベースが開けるかテスト
      await db.open();

      // デフォルトカテゴリの作成
      await this.createDefaultCategories();

      this.isInitialized = true;
      // Database initialized successfully
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new DatabaseError(
        'データベースの初期化に失敗しました',
        'database',
        true
      );
    }
  }

  /**
   * データベース接続をテスト
   */
  public async testConnection(): Promise<boolean> {
    try {
      if (!db.isOpen()) {
        await db.open();
      }
      await db.categories.limit(1).toArray();
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * データベースを閉じる
   */
  public async close(): Promise<void> {
    try {
      await db.close();
      this.isInitialized = false;
      // Database connection closed
    } catch (error) {
      console.error('Error closing database:', error);
      throw new DatabaseError('データベースの切断に失敗しました');
    }
  }

  /**
   * データベースをリセット（開発用）
   */
  public async reset(): Promise<void> {
    try {
      await db.close();
      await db.delete();
      this.isInitialized = false;
      // Database reset successfully
    } catch (error) {
      console.error('Database reset failed:', error);
      throw new DatabaseError('データベースのリセットに失敗しました');
    }
  }

  /**
   * デフォルトカテゴリを作成
   */
  private async createDefaultCategories(): Promise<void> {
    try {
      const allCategories = await db.categories.toArray();
      const existingCategories = allCategories.filter((cat) => cat.isDefault);

      if (existingCategories.length > 0) {
        return; // 既にデフォルトカテゴリが存在する
      }

      const defaultCategories = [
        // 支出カテゴリ
        {
          id: crypto.randomUUID(),
          name: '食費',
          color: '#FF6B6B',
          type: 'expense' as const,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: '交通費',
          color: '#4ECDC4',
          type: 'expense' as const,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: '光熱費',
          color: '#45B7D1',
          type: 'expense' as const,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: '通信費',
          color: '#96CEB4',
          type: 'expense' as const,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: '医療費',
          color: '#FFEAA7',
          type: 'expense' as const,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: '娯楽費',
          color: '#DDA0DD',
          type: 'expense' as const,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: '衣服費',
          color: '#98D8C8',
          type: 'expense' as const,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: 'その他支出',
          color: '#F7DC6F',
          type: 'expense' as const,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },

        // 収入カテゴリ
        {
          id: crypto.randomUUID(),
          name: '給与',
          color: '#52C41A',
          type: 'income' as const,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: '副業',
          color: '#1890FF',
          type: 'income' as const,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          name: 'その他収入',
          color: '#722ED1',
          type: 'income' as const,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await db.categories.bulkAdd(defaultCategories);
      // Default categories created successfully
    } catch (error) {
      console.error('Failed to create default categories:', error);
      throw new DatabaseError('デフォルトカテゴリの作成に失敗しました');
    }
  }

  /**
   * データベースの健全性をチェック
   */
  public async healthCheck(): Promise<{
    isHealthy: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    try {
      // データベースが開いているかチェック
      if (!db.isOpen()) {
        await db.open();
      }

      // 接続テスト
      const isConnected = await this.testConnection();
      if (!isConnected) {
        issues.push('データベース接続に失敗しました');
      }

      // テーブル存在チェック
      try {
        await db.categories.limit(1).toArray();
        await db.transactions.limit(1).toArray();
      } catch (error) {
        issues.push('必要なテーブルが見つかりません');
      }

      // デフォルトカテゴリ存在チェック
      const allCategories = await db.categories.toArray();
      const defaultCategories = allCategories.filter((cat) => cat.isDefault);
      if (defaultCategories.length === 0) {
        issues.push('デフォルトカテゴリが見つかりません');
      }

      return {
        isHealthy: issues.length === 0,
        issues,
      };
    } catch (error) {
      return {
        isHealthy: false,
        issues: ['データベースの健全性チェックに失敗しました'],
      };
    }
  }
}

// シングルトンインスタンス
export const dbConnection = DatabaseConnection.getInstance();
