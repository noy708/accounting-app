import { TransactionHistoryService } from '../TransactionHistoryService';
import { db } from '../../schema';
import { Transaction, TransactionHistory } from '../../../types';

// Mock uuid
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

// Mock the database
jest.mock('../../schema', () => ({
  db: {
    transactionHistory: {
      add: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      toArray: jest.fn(),
      bulkDelete: jest.fn(),
    },
    transactions: {
      toCollection: jest.fn(),
    },
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('TransactionHistoryService', () => {
  let service: TransactionHistoryService;

  beforeEach(() => {
    service = new TransactionHistoryService();
    jest.clearAllMocks();
  });

  describe('recordHistory', () => {
    it('records create history', async () => {
      const transactionData: Partial<Transaction> = {
        id: 'trans1',
        amount: 1000,
        description: 'Test transaction',
        type: 'expense',
      };

      mockDb.transactionHistory.add.mockResolvedValue('history1');

      const result = await service.recordHistory('trans1', 'create', undefined, transactionData);

      expect(mockDb.transactionHistory.add).toHaveBeenCalledWith({
        id: 'mock-uuid',
        transactionId: 'trans1',
        action: 'create',
        previousData: undefined,
        newData: transactionData,
        timestamp: expect.any(Date),
        changes: undefined,
      });

      expect(result).toEqual({
        id: 'mock-uuid',
        transactionId: 'trans1',
        action: 'create',
        previousData: undefined,
        newData: transactionData,
        timestamp: expect.any(Date),
        changes: undefined,
      });
    });

    it('records update history with changes', async () => {
      const previousData: Partial<Transaction> = {
        amount: 1000,
        description: 'Old description',
        categoryId: 'cat1',
        type: 'expense',
        date: new Date('2024-01-01'),
      };

      const newData: Partial<Transaction> = {
        amount: 1500,
        description: 'New description',
        categoryId: 'cat2',
        type: 'expense',
        date: new Date('2024-01-01'),
      };

      mockDb.transactionHistory.add.mockResolvedValue('history2');

      const result = await service.recordHistory('trans1', 'update', previousData, newData);

      expect(result.changes).toEqual(['date', 'amount', 'description', 'categoryId']);
      expect(mockDb.transactionHistory.add).toHaveBeenCalledWith({
        id: 'mock-uuid',
        transactionId: 'trans1',
        action: 'update',
        previousData,
        newData,
        timestamp: expect.any(Date),
        changes: ['date', 'amount', 'description', 'categoryId'],
      });
    });

    it('records update history without changes when no fields changed', async () => {
      const sameData: Partial<Transaction> = {
        amount: 1000,
        description: 'Same description',
        categoryId: 'cat1',
        type: 'expense',
        date: new Date('2024-01-01'),
      };

      mockDb.transactionHistory.add.mockResolvedValue('history3');

      const result = await service.recordHistory('trans1', 'update', sameData, sameData);

      expect(result.changes).toBeUndefined();
    });

    it('records delete history', async () => {
      const transactionData: Partial<Transaction> = {
        id: 'trans1',
        amount: 1000,
        description: 'Deleted transaction',
        type: 'expense',
      };

      mockDb.transactionHistory.add.mockResolvedValue('history4');

      const result = await service.recordHistory('trans1', 'delete', transactionData, undefined);

      expect(mockDb.transactionHistory.add).toHaveBeenCalledWith({
        id: 'mock-uuid',
        transactionId: 'trans1',
        action: 'delete',
        previousData: transactionData,
        newData: undefined,
        timestamp: expect.any(Date),
        changes: undefined,
      });
    });
  });

  describe('getTransactionHistory', () => {
    it('retrieves history for a specific transaction', async () => {
      const mockHistory: TransactionHistory[] = [
        {
          id: 'hist1',
          transactionId: 'trans1',
          action: 'create',
          timestamp: new Date('2024-01-01'),
        },
        {
          id: 'hist2',
          transactionId: 'trans1',
          action: 'update',
          timestamp: new Date('2024-01-02'),
          changes: ['amount'],
        },
      ];

      const mockQuery = {
        equals: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockHistory),
      };

      mockDb.transactionHistory.where.mockReturnValue(mockQuery);

      const result = await service.getTransactionHistory('trans1');

      expect(mockDb.transactionHistory.where).toHaveBeenCalledWith('transactionId');
      expect(mockQuery.equals).toHaveBeenCalledWith('trans1');
      expect(mockQuery.orderBy).toHaveBeenCalledWith('timestamp');
      expect(result).toEqual(mockHistory);
    });
  });

  describe('getAllHistory', () => {
    it('retrieves all history without pagination', async () => {
      const mockHistory: TransactionHistory[] = [
        {
          id: 'hist1',
          transactionId: 'trans1',
          action: 'create',
          timestamp: new Date('2024-01-01'),
        },
      ];

      const mockQuery = {
        orderBy: jest.fn().mockReturnThis(),
        reverse: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockHistory),
      };

      mockDb.transactionHistory.orderBy.mockReturnValue(mockQuery);

      const result = await service.getAllHistory();

      expect(mockDb.transactionHistory.orderBy).toHaveBeenCalledWith('timestamp');
      expect(mockQuery.reverse).toHaveBeenCalled();
      expect(result).toEqual(mockHistory);
    });

    it('retrieves history with pagination', async () => {
      const mockHistory: TransactionHistory[] = [
        {
          id: 'hist1',
          transactionId: 'trans1',
          action: 'create',
          timestamp: new Date('2024-01-01'),
        },
      ];

      const mockQuery = {
        orderBy: jest.fn().mockReturnThis(),
        reverse: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockHistory),
      };

      mockDb.transactionHistory.orderBy.mockReturnValue(mockQuery);

      const result = await service.getAllHistory(10, 20);

      expect(mockQuery.offset).toHaveBeenCalledWith(20);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockHistory);
    });
  });

  describe('deleteTransactionHistory', () => {
    it('deletes history for a specific transaction', async () => {
      const mockQuery = {
        equals: jest.fn().mockReturnThis(),
        delete: jest.fn().mockResolvedValue(undefined),
      };

      mockDb.transactionHistory.where.mockReturnValue(mockQuery);

      await service.deleteTransactionHistory('trans1');

      expect(mockDb.transactionHistory.where).toHaveBeenCalledWith('transactionId');
      expect(mockQuery.equals).toHaveBeenCalledWith('trans1');
      expect(mockQuery.delete).toHaveBeenCalled();
    });
  });

  describe('cleanupOldHistory', () => {
    it('cleans up old history entries', async () => {
      const mockTransactionIds = ['trans1', 'trans2'];
      const mockCollection = {
        primaryKeys: jest.fn().mockResolvedValue(mockTransactionIds),
      };
      mockDb.transactions.toCollection.mockReturnValue(mockCollection);

      // Mock history for trans1 (more than keepLastN)
      const mockHistoryTrans1 = [
        { id: 'hist1', timestamp: new Date('2024-01-03') },
        { id: 'hist2', timestamp: new Date('2024-01-02') },
        { id: 'hist3', timestamp: new Date('2024-01-01') }, // Should be deleted
      ];

      // Mock history for trans2 (less than keepLastN)
      const mockHistoryTrans2 = [
        { id: 'hist4', timestamp: new Date('2024-01-01') },
      ];

      const mockQuery1 = {
        equals: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        reverse: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockHistoryTrans1),
      };

      const mockQuery2 = {
        equals: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        reverse: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockHistoryTrans2),
      };

      mockDb.transactionHistory.where
        .mockReturnValueOnce(mockQuery1)
        .mockReturnValueOnce(mockQuery2);

      mockDb.transactionHistory.bulkDelete.mockResolvedValue(undefined);

      await service.cleanupOldHistory(2);

      expect(mockDb.transactionHistory.bulkDelete).toHaveBeenCalledWith(['hist3']);
    });

    it('uses default keepLastN value', async () => {
      const mockTransactionIds = ['trans1'];
      const mockCollection = {
        primaryKeys: jest.fn().mockResolvedValue(mockTransactionIds),
      };
      mockDb.transactions.toCollection.mockReturnValue(mockCollection);

      // Create 15 history entries (more than default 10)
      const mockHistory = Array.from({ length: 15 }, (_, i) => ({
        id: `hist${i + 1}`,
        timestamp: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
      })).reverse(); // Newest first

      const mockQuery = {
        equals: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        reverse: jest.fn().mockReturnThis(),
        toArray: jest.fn().mockResolvedValue(mockHistory),
      };

      mockDb.transactionHistory.where.mockReturnValue(mockQuery);
      mockDb.transactionHistory.bulkDelete.mockResolvedValue(undefined);

      await service.cleanupOldHistory(); // No parameter, should use default 10

      // Should delete the 5 oldest entries (hist5 to hist1, since they're reversed)
      expect(mockDb.transactionHistory.bulkDelete).toHaveBeenCalledWith([
        'hist5', 'hist4', 'hist3', 'hist2', 'hist1'
      ]);
    });
  });
});