// Tests for ReportService
import { ReportService } from '../ReportService';
import { transactionRepository } from '../../repositories/TransactionRepository';
import { db } from '../../schema';
import { Transaction, Category } from '../../../types';

// Mock the transaction repository
jest.mock('../../repositories/TransactionRepository');
const mockTransactionRepository = transactionRepository as jest.Mocked<typeof transactionRepository>;

// Mock the database
jest.mock('../../schema', () => ({
  db: {
    categories: {
      toArray: jest.fn(),
    },
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('ReportService', () => {
  let reportService: ReportService;

  beforeEach(() => {
    reportService = new ReportService();
    jest.clearAllMocks();
  });

  describe('getMonthlyReport', () => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        date: new Date('2023-06-15'),
        amount: 50000,
        description: '給与',
        categoryId: 'cat1',
        type: 'income',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        date: new Date('2023-06-20'),
        amount: -3000,
        description: '食費',
        categoryId: 'cat2',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        date: new Date('2023-06-25'),
        amount: -1500,
        description: '交通費',
        categoryId: 'cat3',
        type: 'expense',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockCategories: Category[] = [
      {
        id: 'cat1',
        name: '給与',
        color: '#4CAF50',
        type: 'income',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat2',
        name: '食費',
        color: '#FF5722',
        type: 'expense',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'cat3',
        name: '交通費',
        color: '#2196F3',
        type: 'expense',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      mockTransactionRepository.getTransactions.mockResolvedValue(mockTransactions);
      mockDb.categories.toArray.mockResolvedValue(mockCategories);
    });

    it('should generate monthly report correctly', async () => {
      const report = await reportService.getMonthlyReport(2023, 6);

      expect(report).toEqual({
        year: 2023,
        month: 6,
        totalIncome: 50000,
        totalExpense: 4500,
        balance: 45500,
        transactionCount: 3,
        categoryBreakdown: [
          {
            categoryId: 'cat1',
            categoryName: '給与',
            amount: 50000,
            percentage: expect.closeTo(91.7, 1),
            transactionCount: 1,
          },
          {
            categoryId: 'cat2',
            categoryName: '食費',
            amount: 3000,
            percentage: expect.closeTo(5.5, 1),
            transactionCount: 1,
          },
          {
            categoryId: 'cat3',
            categoryName: '交通費',
            amount: 1500,
            percentage: expect.closeTo(2.8, 1),
            transactionCount: 1,
          },
        ],
      });

      // Verify the filter was applied correctly
      expect(mockTransactionRepository.getTransactions).toHaveBeenCalledWith({
        startDate: new Date(2023, 5, 1), // June 1st
        endDate: new Date(2023, 6, 0, 23, 59, 59, 999), // June 30th end of day
      });
    });

    it('should handle empty transaction list', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue([]);

      const report = await reportService.getMonthlyReport(2023, 6);

      expect(report).toEqual({
        year: 2023,
        month: 6,
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0,
        categoryBreakdown: [],
      });
    });

    it('should handle transactions without matching categories', async () => {
      const transactionsWithMissingCategory = [
        {
          ...mockTransactions[0],
          categoryId: 'missing-category',
        },
      ];

      mockTransactionRepository.getTransactions.mockResolvedValue(transactionsWithMissingCategory);

      const report = await reportService.getMonthlyReport(2023, 6);

      expect(report.categoryBreakdown).toEqual([]);
    });
  });

  describe('getCategoryReport', () => {
    it('should generate category report for date range', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          date: new Date('2023-06-15'),
          amount: -3000,
          description: '食費1',
          categoryId: 'cat1',
          type: 'expense',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          date: new Date('2023-06-20'),
          amount: -2000,
          description: '食費2',
          categoryId: 'cat1',
          type: 'expense',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockCategories: Category[] = [
        {
          id: 'cat1',
          name: '食費',
          color: '#FF5722',
          type: 'expense',
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTransactionRepository.getTransactions.mockResolvedValue(mockTransactions);
      mockDb.categories.toArray.mockResolvedValue(mockCategories);

      const startDate = new Date('2023-06-01');
      const endDate = new Date('2023-06-30');
      const report = await reportService.getCategoryReport(startDate, endDate);

      expect(report).toEqual([
        {
          categoryId: 'cat1',
          categoryName: '食費',
          amount: 5000,
          percentage: 100,
          transactionCount: 2,
        },
      ]);

      expect(mockTransactionRepository.getTransactions).toHaveBeenCalledWith({
        startDate,
        endDate,
      });
    });
  });

  describe('getYearlyReport', () => {
    it('should generate yearly report by aggregating monthly reports', async () => {
      // Mock monthly reports for each month
      const mockMonthlyReport = {
        year: 2023,
        month: 1,
        totalIncome: 10000,
        totalExpense: 5000,
        balance: 5000,
        categoryBreakdown: [],
        transactionCount: 2,
      };

      // Mock the getMonthlyReport method
      jest.spyOn(reportService, 'getMonthlyReport').mockResolvedValue(mockMonthlyReport);

      const report = await reportService.getYearlyReport(2023);

      expect(report).toEqual({
        year: 2023,
        monthlyData: Array(12).fill(mockMonthlyReport),
        totalIncome: 120000, // 10000 * 12
        totalExpense: 60000, // 5000 * 12
        balance: 60000, // 120000 - 60000
      });

      // Verify getMonthlyReport was called for each month
      expect(reportService.getMonthlyReport).toHaveBeenCalledTimes(12);
      for (let month = 1; month <= 12; month++) {
        expect(reportService.getMonthlyReport).toHaveBeenCalledWith(2023, month);
      }
    });
  });

  describe('getDailyStats', () => {
    it('should generate daily statistics', async () => {
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          date: new Date('2023-06-15'),
          amount: 50000,
          description: '給与',
          categoryId: 'cat1',
          type: 'income',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          date: new Date('2023-06-15'),
          amount: -3000,
          description: '食費',
          categoryId: 'cat2',
          type: 'expense',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          date: new Date('2023-06-16'),
          amount: -1500,
          description: '交通費',
          categoryId: 'cat3',
          type: 'expense',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockTransactionRepository.getTransactions.mockResolvedValue(mockTransactions);

      const startDate = new Date('2023-06-15');
      const endDate = new Date('2023-06-16');
      const stats = await reportService.getDailyStats(startDate, endDate);

      expect(stats).toEqual([
        {
          date: '2023-06-15',
          income: 50000,
          expense: 3000,
          balance: 47000,
        },
        {
          date: '2023-06-16',
          income: 0,
          expense: 1500,
          balance: -1500,
        },
      ]);
    });

    it('should handle empty transaction list', async () => {
      mockTransactionRepository.getTransactions.mockResolvedValue([]);

      const startDate = new Date('2023-06-15');
      const endDate = new Date('2023-06-16');
      const stats = await reportService.getDailyStats(startDate, endDate);

      expect(stats).toEqual([]);
    });
  });
});