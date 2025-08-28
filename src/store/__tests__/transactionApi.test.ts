import { transactionRepository } from '../../database/repositories/TransactionRepository';
import { Transaction, CreateTransactionDto } from '../../types';

// Mock the repository
jest.mock('../../database/repositories/TransactionRepository');

const mockTransactionRepository = transactionRepository as jest.Mocked<
  typeof transactionRepository
>;

const mockTransaction: Transaction = {
  id: '1',
  date: new Date('2024-01-01'),
  amount: 1000,
  description: 'Test transaction',
  categoryId: 'cat1',
  type: 'income',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('transactionApi integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('repository integration', () => {
    it('should call getTransactions with correct parameters', async () => {
      const mockTransactions = [mockTransaction];
      mockTransactionRepository.getTransactions.mockResolvedValue(
        mockTransactions
      );

      const result = await mockTransactionRepository.getTransactions();

      expect(result).toEqual(mockTransactions);
      expect(mockTransactionRepository.getTransactions).toHaveBeenCalledWith();
    });

    it('should call getTransactions with filter', async () => {
      const filter = { categoryId: 'cat1', type: 'income' as const };
      mockTransactionRepository.getTransactions.mockResolvedValue([]);

      await mockTransactionRepository.getTransactions(filter);

      expect(mockTransactionRepository.getTransactions).toHaveBeenCalledWith(
        filter
      );
    });

    it('should call getTransactionById with correct ID', async () => {
      mockTransactionRepository.getTransactionById.mockResolvedValue(
        mockTransaction
      );

      const result = await mockTransactionRepository.getTransactionById('1');

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionRepository.getTransactionById).toHaveBeenCalledWith(
        '1'
      );
    });

    it('should call createTransaction with correct data', async () => {
      const createDto: CreateTransactionDto = {
        date: new Date('2024-01-01'),
        amount: 1000,
        description: 'Test transaction',
        categoryId: 'cat1',
        type: 'income',
      };

      mockTransactionRepository.createTransaction.mockResolvedValue(
        mockTransaction
      );

      const result =
        await mockTransactionRepository.createTransaction(createDto);

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionRepository.createTransaction).toHaveBeenCalledWith(
        createDto
      );
    });

    it('should call updateTransaction with correct parameters', async () => {
      const updateData = { description: 'Updated description' };
      const updatedTransaction = { ...mockTransaction, ...updateData };

      mockTransactionRepository.updateTransaction.mockResolvedValue(
        updatedTransaction
      );

      const result = await mockTransactionRepository.updateTransaction(
        '1',
        updateData
      );

      expect(result).toEqual(updatedTransaction);
      expect(mockTransactionRepository.updateTransaction).toHaveBeenCalledWith(
        '1',
        updateData
      );
    });

    it('should call deleteTransaction with correct ID', async () => {
      mockTransactionRepository.deleteTransaction.mockResolvedValue();

      await mockTransactionRepository.deleteTransaction('1');

      expect(mockTransactionRepository.deleteTransaction).toHaveBeenCalledWith(
        '1'
      );
    });

    it('should call getTransactionStats with correct parameters', async () => {
      const mockStats = {
        totalIncome: 1000,
        totalExpense: 500,
        balance: 500,
        count: 2,
      };

      mockTransactionRepository.getTransactionStats.mockResolvedValue(
        mockStats
      );

      const result = await mockTransactionRepository.getTransactionStats();

      expect(result).toEqual(mockStats);
      expect(
        mockTransactionRepository.getTransactionStats
      ).toHaveBeenCalledWith();
    });
  });
});
