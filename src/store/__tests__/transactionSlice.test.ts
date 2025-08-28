import transactionReducer, {
  addTransaction,
  updateTransaction,
  removeTransaction,
  setTransactions,
  setCurrentTransaction,
  setFilter,
  clearFilter,
  setPagination,
  setLoading,
  resetTransactionState,
} from '../slices/transactionSlice';
import { Transaction, TransactionFilter } from '../../types';

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

const initialState = {
  transactions: [],
  currentTransaction: null,
  loading: {
    isLoading: false,
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },
  filter: {},
  lastUpdated: null,
};

describe('transactionSlice', () => {
  it('should return the initial state', () => {
    expect(transactionReducer(undefined, { type: 'unknown' })).toEqual(
      initialState
    );
  });

  it('should handle addTransaction', () => {
    const actual = transactionReducer(
      initialState,
      addTransaction(mockTransaction)
    );
    expect(actual.transactions).toHaveLength(1);
    expect(actual.transactions[0]).toEqual(mockTransaction);
    expect(actual.pagination.total).toBe(1);
    expect(actual.lastUpdated).toBeTruthy();
  });

  it('should handle updateTransaction', () => {
    const stateWithTransaction = {
      ...initialState,
      transactions: [mockTransaction],
    };

    const updatedTransaction = {
      ...mockTransaction,
      description: 'Updated description',
    };
    const actual = transactionReducer(
      stateWithTransaction,
      updateTransaction(updatedTransaction)
    );

    expect(actual.transactions[0].description).toBe('Updated description');
    expect(actual.lastUpdated).toBeTruthy();
  });

  it('should handle removeTransaction', () => {
    const stateWithTransaction = {
      ...initialState,
      transactions: [mockTransaction],
      pagination: { ...initialState.pagination, total: 1 },
    };

    const actual = transactionReducer(
      stateWithTransaction,
      removeTransaction('1')
    );

    expect(actual.transactions).toHaveLength(0);
    expect(actual.pagination.total).toBe(0);
    expect(actual.lastUpdated).toBeTruthy();
  });

  it('should handle setTransactions', () => {
    const transactions = [mockTransaction, { ...mockTransaction, id: '2' }];
    const actual = transactionReducer(
      initialState,
      setTransactions(transactions)
    );

    expect(actual.transactions).toHaveLength(2);
    expect(actual.pagination.total).toBe(2);
    expect(actual.lastUpdated).toBeTruthy();
  });

  it('should handle setCurrentTransaction', () => {
    const actual = transactionReducer(
      initialState,
      setCurrentTransaction(mockTransaction)
    );
    expect(actual.currentTransaction).toEqual(mockTransaction);
  });

  it('should handle setFilter', () => {
    const filter: TransactionFilter = {
      startDate: new Date('2024-01-01'),
      categoryId: 'cat1',
    };

    const actual = transactionReducer(initialState, setFilter(filter));
    expect(actual.filter).toEqual(filter);
    expect(actual.pagination.page).toBe(1); // Should reset page
  });

  it('should handle clearFilter', () => {
    const stateWithFilter = {
      ...initialState,
      filter: { categoryId: 'cat1' },
      pagination: { ...initialState.pagination, page: 3 },
    };

    const actual = transactionReducer(stateWithFilter, clearFilter());
    expect(actual.filter).toEqual({});
    expect(actual.pagination.page).toBe(1);
  });

  it('should handle setPagination', () => {
    const actual = transactionReducer(
      initialState,
      setPagination({ page: 2, pageSize: 10 })
    );
    expect(actual.pagination.page).toBe(2);
    expect(actual.pagination.pageSize).toBe(10);
    expect(actual.pagination.total).toBe(0); // Should keep existing total
  });

  it('should handle setLoading', () => {
    const actual = transactionReducer(
      initialState,
      setLoading({ isLoading: true, operation: 'create' })
    );
    expect(actual.loading.isLoading).toBe(true);
    expect(actual.loading.operation).toBe('create');
  });

  it('should handle resetTransactionState', () => {
    const modifiedState = {
      ...initialState,
      transactions: [mockTransaction],
      currentTransaction: mockTransaction,
      filter: { categoryId: 'cat1' },
    };

    const actual = transactionReducer(modifiedState, resetTransactionState());
    expect(actual).toEqual(initialState);
  });
});
