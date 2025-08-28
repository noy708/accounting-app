import { DataImportService, ImportOptions } from '../DataImportService';
import { TransactionRepository } from '../../repositories/TransactionRepository';
import { CategoryRepository } from '../../repositories/CategoryRepository';
import { Transaction, Category } from '../../../types';

// Mock the repositories
jest.mock('../../repositories/TransactionRepository');
jest.mock('../../repositories/CategoryRepository');

const MockedTransactionRepository = TransactionRepository as jest.MockedClass<typeof TransactionRepository>;
const MockedCategoryRepository = CategoryRepository as jest.MockedClass<typeof CategoryRepository>;

describe('DataImportService', () => {
  let service: DataImportService;
  let mockTransactionRepo: jest.Mocked<TransactionRepository>;
  let mockCategoryRepo: jest.Mocked<CategoryRepository>;

  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: '食費',
      color: '#FF5722',
      type: 'expense',
      isDefault: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'cat2',
      name: '給与',
      color: '#4CAF50',
      type: 'income',
      isDefault: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'trans1',
      date: new Date('2024-01-15'),
      amount: -1000,
      description: 'ランチ',
      categoryId: 'cat1',
      type: 'expense',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTransactionRepo = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getById: jest.fn(),
      getTransactions: jest.fn(),
    } as any;

    mockCategoryRepo = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getById: jest.fn(),
      getAll: jest.fn(),
    } as any;

    MockedTransactionRepository.mockImplementation(() => mockTransactionRepo);
    MockedCategoryRepository.mockImplementation(() => mockCategoryRepo);

    service = new DataImportService();
  });

  describe('importFromCSV', () => {
    const defaultOptions: ImportOptions = {
      skipDuplicates: true,
      updateExisting: false,
      createMissingCategories: true
    };

    beforeEach(() => {
      mockCategoryRepo.getAll.mockResolvedValue(mockCategories);
      mockTransactionRepo.getTransactions.mockResolvedValue(mockTransactions);
    });

    it('should import categories successfully', async () => {
      const categoryCsv = `カテゴリ名,色,種類,デフォルト,作成日時,更新日時
"交通費","#2196F3","支出","いいえ","2024-01-01 00:00:00","2024-01-01 00:00:00"`;

      mockCategoryRepo.create.mockResolvedValue({
        id: 'new-cat',
        name: '交通費',
        color: '#2196F3',
        type: 'expense',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await service.importFromCSV(undefined, categoryCsv, defaultOptions);

      expect(result.categories.imported).toBe(1);
      expect(result.categories.skipped).toBe(0);
      expect(result.categories.errors).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockCategoryRepo.create).toHaveBeenCalledWith({
        name: '交通費',
        color: '#2196F3',
        type: 'expense'
      });
    });

    it('should import transactions successfully', async () => {
      const transactionCsv = `日付,金額,種類,カテゴリ,説明,作成日時,更新日時
"2024/01/20","-500","支出","食費","コーヒー","2024-01-20 10:00:00","2024-01-20 10:00:00"`;

      mockTransactionRepo.create.mockResolvedValue({
        id: 'new-trans',
        date: new Date('2024-01-20'),
        amount: -500,
        description: 'コーヒー',
        categoryId: 'cat1',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await service.importFromCSV(transactionCsv, undefined, defaultOptions);

      expect(result.transactions.imported).toBe(1);
      expect(result.transactions.skipped).toBe(0);
      expect(result.transactions.errors).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockTransactionRepo.create).toHaveBeenCalledWith({
        date: new Date(Date.UTC(2024, 0, 20)),
        amount: -500,
        description: 'コーヒー',
        categoryId: 'cat1',
        type: 'expense'
      });
    });

    it('should skip duplicate transactions when skipDuplicates is true', async () => {
      const transactionCsv = `日付,金額,種類,カテゴリ,説明,作成日時,更新日時
"2024/01/15","-1000","支出","食費","ランチ","2024-01-15 12:00:00","2024-01-15 12:00:00"`;

      const result = await service.importFromCSV(transactionCsv, undefined, defaultOptions);

      expect(result.transactions.imported).toBe(0);
      expect(result.transactions.skipped).toBe(1);
      expect(result.transactions.errors).toBe(0);
      expect(mockTransactionRepo.create).not.toHaveBeenCalled();
    });

    it('should skip duplicate categories when skipDuplicates is true', async () => {
      const categoryCsv = `カテゴリ名,色,種類,デフォルト,作成日時,更新日時
"食費","#FF5722","支出","はい","2024-01-01 00:00:00","2024-01-01 00:00:00"`;

      const result = await service.importFromCSV(undefined, categoryCsv, defaultOptions);

      expect(result.categories.imported).toBe(0);
      expect(result.categories.skipped).toBe(1);
      expect(result.categories.errors).toBe(0);
      expect(mockCategoryRepo.create).not.toHaveBeenCalled();
    });

    it('should update existing categories when updateExisting is true', async () => {
      const categoryCsv = `カテゴリ名,色,種類,デフォルト,作成日時,更新日時
"食費","#FF9800","支出","はい","2024-01-01 00:00:00","2024-01-01 00:00:00"`;

      const options: ImportOptions = {
        skipDuplicates: false,
        updateExisting: true,
        createMissingCategories: true
      };

      const result = await service.importFromCSV(undefined, categoryCsv, options);

      expect(result.categories.imported).toBe(1);
      expect(result.categories.skipped).toBe(0);
      expect(result.categories.errors).toBe(0);
      expect(mockCategoryRepo.update).toHaveBeenCalledWith('cat1', {
        color: '#FF9800',
        type: 'expense'
      });
    });

    it('should handle validation errors for categories', async () => {
      const categoryCsv = `カテゴリ名,色,種類,デフォルト,作成日時,更新日時
"","#FF5722","支出","はい","2024-01-01 00:00:00","2024-01-01 00:00:00"
"交通費","","支出","いいえ","2024-01-01 00:00:00","2024-01-01 00:00:00"
"光熱費","#FFC107","無効","いいえ","2024-01-01 00:00:00","2024-01-01 00:00:00"`;

      const result = await service.importFromCSV(undefined, categoryCsv, defaultOptions);

      expect(result.categories.imported).toBe(0);
      expect(result.categories.skipped).toBe(0);
      expect(result.categories.errors).toBe(3);
      expect(result.errors).toHaveLength(3); // 3 rows with errors
      expect(result.errors[0].message).toContain('カテゴリ名は必須です');
      expect(result.errors[1].message).toContain('色は必須です');
      expect(result.errors[2].message).toContain('種類は「収入」「支出」「両方」のいずれかである必要があります');
    });

    it('should handle validation errors for transactions', async () => {
      const transactionCsv = `日付,金額,種類,カテゴリ,説明,作成日時,更新日時
"invalid-date","-500","支出","食費","テスト","2024-01-20 10:00:00","2024-01-20 10:00:00"
"2024/01/20","invalid-amount","支出","食費","テスト","2024-01-20 10:00:00","2024-01-20 10:00:00"
"2024/01/20","-500","無効","食費","テスト","2024-01-20 10:00:00","2024-01-20 10:00:00"
"2024/01/20","-500","支出","存在しないカテゴリ","テスト","2024-01-20 10:00:00","2024-01-20 10:00:00"
"2024/01/20","-500","支出","食費","","2024-01-20 10:00:00","2024-01-20 10:00:00"`;

      const result = await service.importFromCSV(transactionCsv, undefined, defaultOptions);

      expect(result.transactions.imported).toBe(0);
      expect(result.transactions.skipped).toBe(0);
      expect(result.transactions.errors).toBe(5);
      expect(result.errors).toHaveLength(5);
      expect(result.errors[0].message).toContain('日付の形式が正しくありません');
      expect(result.errors[1].message).toContain('金額は数値である必要があります');
      expect(result.errors[2].message).toContain('種類は「収入」または「支出」である必要があります');
      expect(result.errors[3].message).toContain('カテゴリ「存在しないカテゴリ」が見つかりません');
      expect(result.errors[4].message).toContain('説明は必須です');
    });

    it('should handle CSV parsing errors', async () => {
      const invalidCsv = 'invalid,csv,format';

      const result = await service.importFromCSV(invalidCsv, undefined, defaultOptions);
      
      expect(result.transactions.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('CSVファイルにデータが含まれていません');
    });

    it('should handle mismatched column count', async () => {
      const invalidCsv = `日付,金額,種類,カテゴリ,説明
"2024/01/20","-500","支出"`;

      const result = await service.importFromCSV(invalidCsv, undefined, defaultOptions);
      
      expect(result.transactions.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('列数が一致しません');
    });

    it('should handle CSV with quoted fields containing commas', async () => {
      const transactionCsv = `日付,金額,種類,カテゴリ,説明,作成日時,更新日時
"2024/01/20","-500","支出","食費","コーヒー, ケーキ","2024-01-20 10:00:00","2024-01-20 10:00:00"`;

      mockTransactionRepo.create.mockResolvedValue({
        id: 'new-trans',
        date: new Date('2024-01-20'),
        amount: -500,
        description: 'コーヒー, ケーキ',
        categoryId: 'cat1',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await service.importFromCSV(transactionCsv, undefined, defaultOptions);

      expect(result.transactions.imported).toBe(1);
      expect(mockTransactionRepo.create).toHaveBeenCalledWith({
        date: new Date(Date.UTC(2024, 0, 20)),
        amount: -500,
        description: 'コーヒー, ケーキ',
        categoryId: 'cat1',
        type: 'expense'
      });
    });

    it('should handle CSV with escaped quotes', async () => {
      const categoryCsv = `カテゴリ名,色,種類,デフォルト,作成日時,更新日時
"カテゴリ""テスト""","#FF5722","支出","いいえ","2024-01-01 00:00:00","2024-01-01 00:00:00"`;

      mockCategoryRepo.create.mockResolvedValue({
        id: 'new-cat',
        name: 'カテゴリ"テスト"',
        color: '#FF5722',
        type: 'expense',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await service.importFromCSV(undefined, categoryCsv, defaultOptions);

      expect(result.categories.imported).toBe(1);
      expect(mockCategoryRepo.create).toHaveBeenCalledWith({
        name: 'カテゴリ"テスト"',
        color: '#FF5722',
        type: 'expense'
      });
    });

    it('should call progress callback during import', async () => {
      const categoryCsv = `カテゴリ名,色,種類,デフォルト,作成日時,更新日時
"交通費","#2196F3","支出","いいえ","2024-01-01 00:00:00","2024-01-01 00:00:00"`;

      const progressCallback = jest.fn();

      await service.importFromCSV(undefined, categoryCsv, defaultOptions, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith({
        current: 0,
        total: 1,
        stage: 'parsing',
        message: 'データを解析中...'
      });

      expect(progressCallback).toHaveBeenCalledWith({
        current: 0,
        total: 1,
        stage: 'importing',
        message: 'カテゴリをインポート中...'
      });

      expect(progressCallback).toHaveBeenCalledWith({
        current: 1,
        total: 1,
        stage: 'complete',
        message: 'インポート完了'
      });
    });

    it('should handle repository errors gracefully', async () => {
      const categoryCsv = `カテゴリ名,色,種類,デフォルト,作成日時,更新日時
"交通費","#2196F3","支出","いいえ","2024-01-01 00:00:00","2024-01-01 00:00:00"`;

      mockCategoryRepo.create.mockRejectedValue(new Error('Database error'));

      const result = await service.importFromCSV(undefined, categoryCsv, defaultOptions);

      expect(result.categories.imported).toBe(0);
      expect(result.categories.errors).toBe(1);
      expect(result.errors[0].message).toContain('Database error');
    });

    it('should correctly handle income amount signs', async () => {
      const transactionCsv = `日付,金額,種類,カテゴリ,説明,作成日時,更新日時
"2024/01/20","-1000","収入","給与","給与","2024-01-20 10:00:00","2024-01-20 10:00:00"
"2024/01/21","1000","収入","給与","給与","2024-01-21 10:00:00","2024-01-21 10:00:00"`;

      mockTransactionRepo.create.mockResolvedValue({} as Transaction);

      const result = await service.importFromCSV(transactionCsv, undefined, defaultOptions);



      expect(result.transactions.imported).toBe(2);
      expect(mockTransactionRepo.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
        amount: 1000, // Should be positive for income
        type: 'income'
      }));
      expect(mockTransactionRepo.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
        amount: 1000, // Should remain positive for income
        type: 'income'
      }));
    });

    it('should correctly handle expense amount signs', async () => {
      const transactionCsv = `日付,金額,種類,カテゴリ,説明,作成日時,更新日時
"2024/01/20","1000","支出","食費","ランチ","2024-01-20 10:00:00","2024-01-20 10:00:00"
"2024/01/21","-1000","支出","食費","ディナー","2024-01-21 10:00:00","2024-01-21 10:00:00"`;

      mockTransactionRepo.create.mockResolvedValue({} as Transaction);

      const result = await service.importFromCSV(transactionCsv, undefined, defaultOptions);

      expect(result.transactions.imported).toBe(2);
      expect(mockTransactionRepo.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
        amount: -1000, // Should be negative for expense
        type: 'expense'
      }));
      expect(mockTransactionRepo.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
        amount: -1000, // Should remain negative for expense
        type: 'expense'
      }));
    });
  });
});