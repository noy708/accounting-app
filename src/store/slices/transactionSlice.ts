import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  Transaction,
  TransactionFilter,
  LoadingState,
  PaginationState,
} from '../../types';

interface TransactionState {
  transactions: Transaction[];
  currentTransaction: Transaction | null;
  loading: LoadingState;
  pagination: PaginationState;
  filter: TransactionFilter;
  lastUpdated: string | null;
}

const initialState: TransactionState = {
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

// Async thunks will be implemented in the next task with RTK Query
// For now, we'll create the basic slice structure

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    // Loading states
    setTransactionLoading: (
      state,
      action: PayloadAction<{ isLoading: boolean; operation?: string }>
    ) => {
      state.loading = action.payload;
    },

    // Transaction CRUD operations (sync)
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      state.pagination.total += 1;
      state.lastUpdated = new Date().toISOString();
    },

    updateTransaction: (state, action: PayloadAction<Transaction>) => {
      const index = state.transactions.findIndex(
        (t) => t.id === action.payload.id
      );
      if (index !== -1) {
        state.transactions[index] = action.payload;
        state.lastUpdated = new Date().toISOString();
      }
    },

    removeTransaction: (state, action: PayloadAction<string>) => {
      state.transactions = state.transactions.filter(
        (t) => t.id !== action.payload
      );
      state.pagination.total -= 1;
      state.lastUpdated = new Date().toISOString();
    },

    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
      state.pagination.total = action.payload.length;
      state.lastUpdated = new Date().toISOString();
    },

    // Current transaction management
    setCurrentTransaction: (
      state,
      action: PayloadAction<Transaction | null>
    ) => {
      state.currentTransaction = action.payload;
    },

    // Filter management
    setFilter: (state, action: PayloadAction<TransactionFilter>) => {
      state.filter = action.payload;
      state.pagination.page = 1; // Reset to first page when filter changes
    },

    clearFilter: (state) => {
      state.filter = {};
      state.pagination.page = 1;
    },

    // Pagination
    setPagination: (state, action: PayloadAction<Partial<PaginationState>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // Reset state
    resetTransactionState: () => {
      return initialState;
    },
  },
});

export const {
  setTransactionLoading,
  addTransaction,
  updateTransaction,
  removeTransaction,
  setTransactions,
  setCurrentTransaction,
  setFilter,
  clearFilter,
  setPagination,
  resetTransactionState,
} = transactionSlice.actions;

export default transactionSlice.reducer;
