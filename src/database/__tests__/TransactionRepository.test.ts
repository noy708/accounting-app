// Unit tests for TransactionRepository
import { TransactionRepository } from '../repositories/TransactionRepository';
import { db } from '../schema';
import { dbConnection, DatabaseError } from '../connection';
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFilter,
  Category,
} from '../../types';

// テスト用のモックデータ
const mockCategory: Category = {
  id: 'test-category-id',
  name: 'テストカテゴリ',
  color: '#FF0000',
  type: 'expense',
  isDefault: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockIncomeCategory: Category = {
  id: 'test-income-category-id',
  name: '給与',
  color: '#00FF00',
  type: 'income',
  isDefault: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockTransactionDto: CreateTransactionDto = {
  date: new Date('2024-01-15'),
  amount: 1000,
  description: 'テスト取引',
  categoryId: 'test-category-id',
  type: 'expense',
};

const mockIncomeTransactionDto: CreateTransactionDto = {
  date: new Date('2024-01-20'),
  amount: 5000,
  description: '給与',
  categoryId: 'test-income-category-id',
  type: 'income',
};

describe('TransactionRepository', () => {
  let repository: TransactionRepository;

  beforeEach(async () => {
    repository = new TransactionRepository();

    // データベースをリセット
    await dbConnection.reset();
    await dbConnection.initialize();

    // テスト用カテゴリを追加
    await db.categories.add(mockCategory);
    await db.categories.add(mockIncomeCategory);
  });

  afterEach(async () => {
    await dbConnection.close();
  });

  describe('createTransaction', () => {
    it('支出取引を正常に作成できる', async () => {
      const result = await repository.createTransaction(mockTransactionDto);

      expect(result.id).toBeDefined();
      expect(result.date).toEqual(mockTransactionDto.date);
      expect(result.amount).toBe(-1000); // 支出は負の値
      expect(result.description).toBe(mockTransactionDto.description);
      expect(result.categoryId).toBe(mockTransactionDto.categoryId);
      expect(result.type).toBe('expense');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('収入取引を正常に作成できる', async () => {
      const result = await repository.createTransaction(
        mockIncomeTransactionDto
      );

      expect(result.id).toBeDefined();
      expect(result.amount).toBe(5000); // 収入は正の値
      expect(result.type).toBe('income');
    });

    it('必須フィールドが不足している場合はバリデーションエラーを投げる', async () => {
      const invalidDto = {
        ...mockTransactionDto,
        date: undefined as any,
        amount: undefined as any,
      };

      await expect(repository.createTransaction(invalidDto)).rejects.toThrow(
        DatabaseError
      );
    });

    it('存在しないカテゴリIDの場合はエラーを投げる', async () => {
      const invalidDto = {
        ...mockTransactionDto,
        categoryId: 'non-existent-category',
      };

      await expect(repository.createTransaction(invalidDto)).rejects.toThrow(
        DatabaseError
      );
    });

    it('金額が0の場合はバリデーションエラーを投げる', async () => {
      const invalidDto = {
        ...mockTransactionDto,
        amount: 0,
      };

      await expect(repository.createTransaction(invalidDto)).rejects.toThrow(
        DatabaseError
      );
    });

    it('負の金額を入力した場合はバリデーションエラーを投げる', async () => {
      const invalidDto = {
        ...mockTransactionDto,
        amount: -1000,
      };

      await expect(repository.createTransaction(invalidDto)).rejects.toThrow(
        DatabaseError
      );
    });

    it('未来の日付の場合はバリデーションエラーを投げる', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const invalidDto = {
        ...mockTransactionDto,
        date: futureDate,
      };

      await expect(repository.createTransaction(invalidDto)).rejects.toThrow(
        DatabaseError
      );
    });

    it('説明文が500文字を超える場合はバリデーションエラーを投げる', async () => {
      const longDescription = 'a'.repeat(501);
      const invalidDto = {
        ...mockTransactionDto,
        description: longDescription,
      };

      await expect(repository.createTransaction(invalidDto)).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('updateTransaction', () => {
    let createdTransaction: Transaction;

    beforeEach(async () => {
      createdTransaction =
        await repository.createTransaction(mockTransactionDto);
    });

    it('取引を正常に更新できる', async () => {
      // 少し待ってから更新して、updatedAtが確実に異なるようにする
      await new Promise((resolve) => setTimeout(resolve, 1));

      const updateDto: UpdateTransactionDto = {
        amount: 2000,
        description: '更新されたテスト取引',
      };

      const result = await repository.updateTransaction(
        createdTransaction.id,
        updateDto
      );

      expect(result.amount).toBe(-2000); // 支出なので負の値
      expect(result.description).toBe('更新されたテスト取引');
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        result.createdAt.getTime()
      );
    });

    it('取引タイプを変更できる', async () => {
      const updateDto: UpdateTransactionDto = {
        type: 'income',
        categoryId: mockIncomeCategory.id,
      };

      const result = await repository.updateTransaction(
        createdTransaction.id,
        updateDto
      );

      expect(result.type).toBe('income');
      expect(result.amount).toBe(1000); // 収入に変更されたので正の値
    });

    it('存在しない取引IDの場合はエラーを投げる', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
      };

      await expect(
        repository.updateTransaction('non-existent-id', updateDto)
      ).rejects.toThrow(DatabaseError);
    });

    it('存在しないカテゴリIDに更新しようとした場合はエラーを投げる', async () => {
      const updateDto: UpdateTransactionDto = {
        categoryId: 'non-existent-category',
      };

      await expect(
        repository.updateTransaction(createdTransaction.id, updateDto)
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('deleteTransaction', () => {
    let createdTransaction: Transaction;

    beforeEach(async () => {
      createdTransaction =
        await repository.createTransaction(mockTransactionDto);
    });

    it('取引を正常に削除できる', async () => {
      await repository.deleteTransaction(createdTransaction.id);

      await expect(
        repository.getTransactionById(createdTransaction.id)
      ).rejects.toThrow(DatabaseError);
    });

    it('存在しない取引IDの場合はエラーを投げる', async () => {
      await expect(
        repository.deleteTransaction('non-existent-id')
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('getTransactionById', () => {
    let createdTransaction: Transaction;

    beforeEach(async () => {
      createdTransaction =
        await repository.createTransaction(mockTransactionDto);
    });

    it('IDで取引を正常に取得できる', async () => {
      const result = await repository.getTransactionById(createdTransaction.id);

      expect(result.id).toBe(createdTransaction.id);
      expect(result.amount).toBe(createdTransaction.amount);
      expect(result.description).toBe(createdTransaction.description);
    });

    it('存在しない取引IDの場合はエラーを投げる', async () => {
      await expect(
        repository.getTransactionById('non-existent-id')
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('getTransactions', () => {
    let expenseTransaction: Transaction;
    let incomeTransaction: Transaction;
    let oldTransaction: Transaction;

    beforeEach(async () => {
      expenseTransaction =
        await repository.createTransaction(mockTransactionDto);
      incomeTransaction = await repository.createTransaction(
        mockIncomeTransactionDto
      );

      // 古い取引を作成
      const oldDto = {
        ...mockTransactionDto,
        date: new Date('2023-12-01'),
        description: '古い取引',
      };
      oldTransaction = await repository.createTransaction(oldDto);
    });

    it('フィルターなしで全ての取引を日付順（新しい順）で取得できる', async () => {
      const result = await repository.getTransactions();

      expect(result).toHaveLength(3);
      expect(result[0].date.getTime()).toBeGreaterThanOrEqual(
        result[1].date.getTime()
      );
      expect(result[1].date.getTime()).toBeGreaterThanOrEqual(
        result[2].date.getTime()
      );
    });

    it('日付範囲フィルターが正常に動作する', async () => {
      const filter: TransactionFilter = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const result = await repository.getTransactions(filter);

      expect(result).toHaveLength(2);
      expect(
        result.every(
          (t) => t.date >= filter.startDate! && t.date <= filter.endDate!
        )
      ).toBe(true);
    });

    it('カテゴリフィルターが正常に動作する', async () => {
      const filter: TransactionFilter = {
        categoryId: mockCategory.id,
      };

      const result = await repository.getTransactions(filter);

      expect(result).toHaveLength(2); // expenseTransactionとoldTransaction
      expect(result.every((t) => t.categoryId === mockCategory.id)).toBe(true);
    });

    it('取引タイプフィルターが正常に動作する', async () => {
      const filter: TransactionFilter = {
        type: 'income',
      };

      const result = await repository.getTransactions(filter);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('income');
    });

    it('金額範囲フィルターが正常に動作する', async () => {
      const filter: TransactionFilter = {
        minAmount: 2000,
        maxAmount: 10000,
      };

      const result = await repository.getTransactions(filter);

      expect(result).toHaveLength(1);
      expect(Math.abs(result[0].amount)).toBeGreaterThanOrEqual(2000);
      expect(Math.abs(result[0].amount)).toBeLessThanOrEqual(10000);
    });

    it('説明文検索フィルターが正常に動作する', async () => {
      const filter: TransactionFilter = {
        description: '給与',
      };

      const result = await repository.getTransactions(filter);

      expect(result).toHaveLength(1);
      expect(result[0].description).toContain('給与');
    });

    it('複数のフィルターを組み合わせて使用できる', async () => {
      const filter: TransactionFilter = {
        type: 'expense',
        startDate: new Date('2024-01-01'),
        categoryId: mockCategory.id,
      };

      const result = await repository.getTransactions(filter);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('expense');
      expect(result[0].categoryId).toBe(mockCategory.id);
    });
  });

  describe('getTransactionStats', () => {
    beforeEach(async () => {
      await repository.createTransaction(mockTransactionDto); // 支出 1000
      await repository.createTransaction(mockIncomeTransactionDto); // 収入 5000
      await repository.createTransaction({
        ...mockTransactionDto,
        amount: 500,
        description: '別の支出',
      }); // 支出 500
    });

    it('統計情報を正常に計算できる', async () => {
      const stats = await repository.getTransactionStats();

      expect(stats.totalIncome).toBe(5000);
      expect(stats.totalExpense).toBe(1500);
      expect(stats.balance).toBe(3500);
      expect(stats.count).toBe(3);
    });

    it('フィルター条件付きで統計情報を計算できる', async () => {
      const filter: TransactionFilter = {
        type: 'expense',
      };

      const stats = await repository.getTransactionStats(filter);

      expect(stats.totalIncome).toBe(0);
      expect(stats.totalExpense).toBe(1500);
      expect(stats.balance).toBe(-1500);
      expect(stats.count).toBe(2);
    });
  });

  describe('バリデーション', () => {
    it('無効な取引タイプの場合はエラーを投げる', async () => {
      const invalidDto = {
        ...mockTransactionDto,
        type: 'invalid' as any,
      };

      await expect(repository.createTransaction(invalidDto)).rejects.toThrow(
        DatabaseError
      );
    });

    it('無効な日付の場合はエラーを投げる', async () => {
      const invalidDto = {
        ...mockTransactionDto,
        date: new Date('invalid-date'),
      };

      await expect(repository.createTransaction(invalidDto)).rejects.toThrow(
        DatabaseError
      );
    });

    it('数値以外の金額の場合はエラーを投げる', async () => {
      const invalidDto = {
        ...mockTransactionDto,
        amount: 'not-a-number' as any,
      };

      await expect(repository.createTransaction(invalidDto)).rejects.toThrow(
        DatabaseError
      );
    });
  });
});
