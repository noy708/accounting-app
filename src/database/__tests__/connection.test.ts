// Database connection tests
import { dbConnection, DatabaseError, db, DatabaseConnection } from '../index';

describe('DatabaseConnection', () => {
  beforeEach(async () => {
    // データベースをリセット
    try {
      await db.close();
    } catch (error) {
      // 既に閉じられている場合は無視
    }
    try {
      await db.delete();
    } catch (error) {
      // データベースが存在しない場合は無視
    }
    // 接続インスタンスの状態をリセット
    DatabaseConnection.resetInstance();
  });

  afterEach(async () => {
    try {
      await db.close();
    } catch (error) {
      // 既に閉じられている場合は無視
    }
  });

  describe('initialize', () => {
    it('should initialize database successfully', async () => {
      await expect(dbConnection.initialize()).resolves.not.toThrow();
    });

    it('should create default categories on initialization', async () => {
      await dbConnection.initialize();

      const allCategories = await db.categories.toArray();
      const categories = allCategories.filter((cat) => cat.isDefault);
      expect(categories.length).toBeGreaterThan(0);

      // 支出カテゴリの確認
      const expenseCategories = categories.filter(
        (cat) => cat.type === 'expense'
      );
      expect(expenseCategories.length).toBeGreaterThan(0);
      expect(expenseCategories.some((cat) => cat.name === '食費')).toBe(true);

      // 収入カテゴリの確認
      const incomeCategories = categories.filter(
        (cat) => cat.type === 'income'
      );
      expect(incomeCategories.length).toBeGreaterThan(0);
      expect(incomeCategories.some((cat) => cat.name === '給与')).toBe(true);
    });

    it('should not create duplicate default categories', async () => {
      await dbConnection.initialize();
      const allCategories1 = await db.categories.toArray();
      const firstCount = allCategories1.filter((cat) => cat.isDefault).length;

      await dbConnection.initialize(); // 2回目の初期化
      const allCategories2 = await db.categories.toArray();
      const secondCount = allCategories2.filter((cat) => cat.isDefault).length;

      expect(firstCount).toBe(secondCount);
    });
  });

  describe('testConnection', () => {
    it('should return true for healthy connection', async () => {
      await dbConnection.initialize();
      const result = await dbConnection.testConnection();
      expect(result).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status after initialization', async () => {
      await dbConnection.initialize();
      const health = await dbConnection.healthCheck();

      expect(health.isHealthy).toBe(true);
      expect(health.issues).toHaveLength(0);
    });

    it('should detect missing default categories', async () => {
      await db.open();
      const health = await dbConnection.healthCheck();

      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain('デフォルトカテゴリが見つかりません');
    });
  });

  describe('reset', () => {
    it('should reset database successfully', async () => {
      await dbConnection.initialize();
      await dbConnection.reset();

      // データベースが削除されていることを確認
      await db.open();
      const categories = await db.categories.toArray();
      expect(categories).toHaveLength(0);
    });
  });
});

describe('DatabaseError', () => {
  it('should create error with correct properties', () => {
    const error = new DatabaseError('Test error', 'database', true);

    expect(error.message).toBe('Test error');
    expect(error.type).toBe('database');
    expect(error.retryable).toBe(true);
    expect(error.name).toBe('DatabaseError');
  });

  it('should use default values', () => {
    const error = new DatabaseError('Test error');

    expect(error.type).toBe('database');
    expect(error.retryable).toBe(false);
  });
});
