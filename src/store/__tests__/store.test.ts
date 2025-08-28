import { configureStore } from '@reduxjs/toolkit';
import transactionSlice, { addTransaction } from '../slices/transactionSlice';
import categorySlice, { addCategory } from '../slices/categorySlice';
import errorSlice, { addError } from '../slices/errorSlice';

// Create a test store without RTK Query to avoid Jest issues
const createTestStore = () => {
  return configureStore({
    reducer: {
      transactions: transactionSlice,
      categories: categorySlice,
      errors: errorSlice,
    },
  });
};

describe('Redux Store Integration', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('should have the correct initial state structure', () => {
    const state = store.getState();
    
    expect(state).toHaveProperty('transactions');
    expect(state).toHaveProperty('categories');
    expect(state).toHaveProperty('errors');
    
    // Check initial state structure
    expect(state.transactions).toMatchObject({
      transactions: [],
      currentTransaction: null,
      loading: { isLoading: false },
      pagination: { page: 1, pageSize: 20, total: 0 },
      filter: {},
      lastUpdated: null,
    });
    
    expect(state.categories).toMatchObject({
      categories: [],
      currentCategory: null,
      loading: { isLoading: false },
      lastUpdated: null,
    });
    
    expect(state.errors).toMatchObject({
      errors: [],
      globalError: null,
      lastError: null,
    });
  });

  it('should handle transaction actions', () => {
    const mockTransaction = {
      id: '1',
      date: new Date('2024-01-01'),
      amount: 1000,
      description: 'Test transaction',
      categoryId: 'cat1',
      type: 'income' as const,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    store.dispatch(addTransaction(mockTransaction));
    
    const state = store.getState();
    expect(state.transactions.transactions).toHaveLength(1);
    expect(state.transactions.transactions[0]).toEqual(mockTransaction);
    expect(state.transactions.pagination.total).toBe(1);
  });

  it('should handle category actions', () => {
    const mockCategory = {
      id: '1',
      name: 'Food',
      color: '#FF5722',
      type: 'expense' as const,
      isDefault: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    store.dispatch(addCategory(mockCategory));
    
    const state = store.getState();
    expect(state.categories.categories).toHaveLength(1);
    expect(state.categories.categories[0]).toEqual(mockCategory);
  });

  it('should handle error actions', () => {
    const mockError = {
      message: 'Test error',
      type: 'validation' as const,
      field: 'amount',
      retryable: false,
    };

    store.dispatch(addError(mockError));
    
    const state = store.getState();
    expect(state.errors.errors).toHaveLength(1);
    expect(state.errors.lastError).toEqual(mockError);
  });
});