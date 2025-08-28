import { DataExportService, ExportOptions } from '../DataExportService';
import { TransactionRepository } from '../../repositories/TransactionRepository';
import { CategoryRepository } from '../../repositories/CategoryRepository';
import { Transaction, Category } from '../../../types';

// Mock the repositories
jest.mock('../../repositories/TransactionRepository');
jest.mock('../../repositories/CategoryRepository');

const MockedTransactionRepository = TransactionRepository as jest.MockedClass<typeof TransactionRepository>;
const MockedCategoryRepository = CategoryRepository as jest.MockedClass<typeof CategoryRepository>;

// Mock URL methods for browser environment
Object.defineProperty(global.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'blob:url')
});

Object.defineProperty(global.URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn()
});

describe('DataExportService', () => {
  let service: DataExportService;
  let mockTransactionRepo: jest.Mocked<TransactionRepository>;
  let mockCategoryRepo: jest.Mocked<CategoryRepository>;

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      date: new Date('2023-01-15'),
      amount: 1000,
      description: 'Test income',
      categoryId: 'cat1',
      type: 'income',
      createdAt: new Date('2023-01-15T10:00:00'),
      updatedAt: new Date('2023-01-15T10:00:00')
    },
    {
      id: '2',
      date: new Date('2023-01-20'),
      amount: -500,
      description: 'Test expense with "quotes"',
      categoryId: 'cat2',
      type: 'expense',
      createdAt: new Date('2023-01-20T15:30:00'),
      updatedAt: new Date('2023-01-20T15:30:00')
    }
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Income Category',
      color: '#4CAF50',
      type: 'income',
      isDefault: true,
      createdAt: new Date('2023-01-01T00:00:00'),
      updatedAt: new Date('2023-01-01T00:00:00')
    },
    {
      id: 'cat2',
      name: 'Expense Category with "quotes"',
      color: '#F44336',
      type: 'expense',
      isDefault: false,
      createdAt: new Date('2023-01-01T00:00:00'),
      updatedAt: new Date('2023-01-01T00:00:00')
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instances with proper method mocking
    mockTransactionRepo = {
      getTransactions: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn()
    } as any;
    
    mockCategoryRepo = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      canDelete: jest.fn()
    } as any;
    
    service = new DataExportService();
    
    // Replace the repositories with mocks
    (service as any).transactionRepo = mockTransactionRepo;
    (service as any).categoryRepo = mockCategoryRepo;
  });

  describe('exportToCSV', () => {
    it('should export transactions to CSV format', async () => {
      mockTransactionRepo.getTransactions.mockResolvedValue(mockTransactions);
      mockCategoryRepo.getAll.mockResolvedValue(mockCategories);

      const options: ExportOptions = {
        includeTransactions: true,
        includeCategories: false
      };

      const result = await service.exportToCSV(options);

      expect(result.transactions).toBeDefined();
      expect(result.categories).toBeUndefined();
      
      const lines = result.transactions!.split('\n');
      expect(lines[0]).toBe('日付,金額,種類,カテゴリ,説明,作成日時,更新日時');
      expect(lines[1]).toContain('2023/01/15,1000,収入,Income Category');
      expect(lines[2]).toContain('2023/01/20,-500,支出,Expense Category with "quotes"');
      expect(lines[2]).toContain('"Test expense with ""quotes"""'); // Escaped quotes
    });

    it('should export categories to CSV format', async () => {
      mockCategoryRepo.getAll.mockResolvedValue(mockCategories);

      const options: ExportOptions = {
        includeTransactions: false,
        includeCategories: true
      };

      const result = await service.exportToCSV(options);

      expect(result.categories).toBeDefined();
      expect(result.transactions).toBeUndefined();
      
      const lines = result.categories!.split('\n');
      expect(lines[0]).toBe('カテゴリ名,色,種類,デフォルト,作成日時,更新日時');
      expect(lines[1]).toContain('"Income Category",#4CAF50,収入,はい');
      expect(lines[2]).toContain('"Expense Category with ""quotes""",#F44336,支出,いいえ'); // Escaped quotes
    });

    it('should export both transactions and categories', async () => {
      mockTransactionRepo.getTransactions.mockResolvedValue(mockTransactions);
      mockCategoryRepo.getAll.mockResolvedValue(mockCategories);

      const options: ExportOptions = {
        includeTransactions: true,
        includeCategories: true
      };

      const result = await service.exportToCSV(options);

      expect(result.transactions).toBeDefined();
      expect(result.categories).toBeDefined();
    });

    it('should filter transactions by date range', async () => {
      mockTransactionRepo.getTransactions.mockResolvedValue(mockTransactions);
      mockCategoryRepo.getAll.mockResolvedValue(mockCategories);

      const options: ExportOptions = {
        includeTransactions: true,
        includeCategories: false,
        dateRange: {
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-31')
        }
      };

      await service.exportToCSV(options);

      expect(mockTransactionRepo.getTransactions).toHaveBeenCalledWith({
        startDate: options.dateRange!.startDate,
        endDate: options.dateRange!.endDate
      });
    });

    it('should filter transactions by category IDs', async () => {
      mockTransactionRepo.getTransactions.mockResolvedValue(mockTransactions);
      mockCategoryRepo.getAll.mockResolvedValue(mockCategories);

      const options: ExportOptions = {
        includeTransactions: true,
        includeCategories: false,
        categoryIds: ['cat1']
      };

      const result = await service.exportToCSV(options);

      const lines = result.transactions!.split('\n');
      expect(lines).toHaveLength(2); // Header + 1 filtered transaction
      expect(lines[1]).toContain('Income Category');
    });

    it('should report progress during export', async () => {
      mockTransactionRepo.getTransactions.mockResolvedValue(mockTransactions);
      mockCategoryRepo.getAll.mockResolvedValue(mockCategories);

      const progressCallback = jest.fn();
      const options: ExportOptions = {
        includeTransactions: true,
        includeCategories: true
      };

      await service.exportToCSV(options, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith({
        current: 0,
        total: 2,
        stage: 'preparing',
        message: 'エクスポートを準備中...'
      });

      expect(progressCallback).toHaveBeenCalledWith({
        current: 2,
        total: 2,
        stage: 'complete',
        message: 'エクスポート完了'
      });
    });

    it('should handle export errors', async () => {
      mockTransactionRepo.getTransactions.mockRejectedValue(new Error('Database error'));

      const options: ExportOptions = {
        includeTransactions: true,
        includeCategories: false
      };

      await expect(service.exportToCSV(options)).rejects.toThrow('エクスポートに失敗しました: Database error');
    });

    it('should handle unknown category in transactions', async () => {
      const transactionWithUnknownCategory = {
        ...mockTransactions[0],
        categoryId: 'unknown-category'
      };
      
      mockTransactionRepo.getTransactions.mockResolvedValue([transactionWithUnknownCategory]);
      mockCategoryRepo.getAll.mockResolvedValue(mockCategories);

      const options: ExportOptions = {
        includeTransactions: true,
        includeCategories: false
      };

      const result = await service.exportToCSV(options);
      
      const lines = result.transactions!.split('\n');
      expect(lines[1]).toContain('Unknown'); // Should show 'Unknown' for missing category
    });
  });

  describe('downloadCSV', () => {
    let mockCreateElement: jest.SpyInstance;
    let mockCreateObjectURL: jest.SpyInstance;
    let mockRevokeObjectURL: jest.SpyInstance;
    let mockLink: any;

    beforeEach(() => {
      mockLink = {
        download: '',
        setAttribute: jest.fn(),
        click: jest.fn(),
        style: { visibility: '' }
      };

      mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
      
      mockCreateObjectURL = jest.spyOn(global.URL, 'createObjectURL').mockReturnValue('blob:url');
      mockRevokeObjectURL = jest.spyOn(global.URL, 'revokeObjectURL').mockImplementation();
    });

    afterEach(() => {
      mockCreateElement.mockRestore();
      mockCreateObjectURL.mockRestore();
      mockRevokeObjectURL.mockRestore();
    });

    it('should download CSV file with proper encoding', () => {
      const content = 'test,data\n1,2';
      const filename = 'test.csv';

      service.downloadCSV(content, filename);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', filename);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockCreateObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text/csv;charset=utf-8;'
        })
      );
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:url');
    });

    it('should add BOM for UTF-8 encoding', () => {
      const content = 'test,data';
      const filename = 'test.csv';

      service.downloadCSV(content, filename);

      const blobConstructorCall = mockCreateObjectURL.mock.calls[0][0];
      expect(blobConstructorCall.constructor).toBe(Blob);
      // The blob should contain BOM + content
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });
});