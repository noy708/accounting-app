import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ProgressState {
  operations: Record<string, OperationProgress>;
  globalLoading: boolean;
  loadingCount: number;
}

interface OperationProgress {
  id: string;
  name: string;
  progress: number; // 0-100
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  startTime: number;
  estimatedDuration?: number;
  indeterminate?: boolean;
}

const initialState: ProgressState = {
  operations: {},
  globalLoading: false,
  loadingCount: 0,
};

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    startOperation: (
      state,
      action: PayloadAction<{
        id: string;
        name: string;
        message?: string;
        estimatedDuration?: number;
        indeterminate?: boolean;
      }>
    ) => {
      const {
        id,
        name,
        message,
        estimatedDuration,
        indeterminate = false,
      } = action.payload;

      state.operations[id] = {
        id,
        name,
        progress: 0,
        status: 'loading',
        message,
        startTime: Date.now(),
        estimatedDuration,
        indeterminate,
      };

      state.loadingCount++;
      state.globalLoading = true;
    },

    updateProgress: (
      state,
      action: PayloadAction<{
        id: string;
        progress?: number;
        message?: string;
      }>
    ) => {
      const { id, progress, message } = action.payload;
      const operation = state.operations[id];

      if (operation) {
        if (progress !== undefined) {
          operation.progress = Math.min(100, Math.max(0, progress));
        }
        if (message !== undefined) {
          operation.message = message;
        }
      }
    },

    completeOperation: (
      state,
      action: PayloadAction<{
        id: string;
        message?: string;
      }>
    ) => {
      const { id, message } = action.payload;
      const operation = state.operations[id];

      if (operation && operation.status === 'loading') {
        operation.status = 'success';
        operation.progress = 100;
        if (message) {
          operation.message = message;
        }

        state.loadingCount = Math.max(0, state.loadingCount - 1);
        state.globalLoading = state.loadingCount > 0;

        // Remove completed operation after a delay
        setTimeout(() => {
          delete state.operations[id];
        }, 3000);
      }
    },

    failOperation: (
      state,
      action: PayloadAction<{
        id: string;
        message?: string;
      }>
    ) => {
      const { id, message } = action.payload;
      const operation = state.operations[id];

      if (operation && operation.status === 'loading') {
        operation.status = 'error';
        if (message) {
          operation.message = message;
        }

        state.loadingCount = Math.max(0, state.loadingCount - 1);
        state.globalLoading = state.loadingCount > 0;

        // Remove failed operation after a delay
        setTimeout(() => {
          delete state.operations[id];
        }, 5000);
      }
    },

    cancelOperation: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const operation = state.operations[id];

      if (operation && operation.status === 'loading') {
        state.loadingCount = Math.max(0, state.loadingCount - 1);
        state.globalLoading = state.loadingCount > 0;
      }

      delete state.operations[id];
    },

    clearCompletedOperations: (state) => {
      Object.keys(state.operations).forEach((id) => {
        const operation = state.operations[id];
        if (operation.status === 'success' || operation.status === 'error') {
          delete state.operations[id];
        }
      });
    },

    clearAllOperations: (state) => {
      state.operations = {};
      state.loadingCount = 0;
      state.globalLoading = false;
    },

    // Helper actions for common operations
    startDataLoad: (
      state,
      action: PayloadAction<{
        type: 'transactions' | 'categories' | 'reports';
        message?: string;
      }>
    ) => {
      const { type, message } = action.payload;
      const id = `load-${type}`;

      state.operations[id] = {
        id,
        name: `Loading ${type}`,
        progress: 0,
        status: 'loading',
        message: message || `Loading ${type}...`,
        startTime: Date.now(),
        indeterminate: true,
      };

      state.loadingCount++;
      state.globalLoading = true;
    },

    startDataSave: (
      state,
      action: PayloadAction<{
        type: 'transaction' | 'category';
        operation: 'create' | 'update' | 'delete';
        message?: string;
      }>
    ) => {
      const { type, operation, message } = action.payload;
      const id = `save-${type}-${operation}`;

      state.operations[id] = {
        id,
        name: `${operation} ${type}`,
        progress: 0,
        status: 'loading',
        message: message || `${operation}ing ${type}...`,
        startTime: Date.now(),
        estimatedDuration: 2000, // 2 seconds estimated
        indeterminate: false,
      };

      state.loadingCount++;
      state.globalLoading = true;
    },

    startExport: (
      state,
      action: PayloadAction<{
        format: 'csv' | 'json';
        totalItems?: number;
      }>
    ) => {
      const { format, totalItems } = action.payload;
      const id = `export-${format}`;

      state.operations[id] = {
        id,
        name: `Export to ${format.toUpperCase()}`,
        progress: 0,
        status: 'loading',
        message: `Preparing ${format.toUpperCase()} export...`,
        startTime: Date.now(),
        estimatedDuration: totalItems ? totalItems * 10 : 5000, // 10ms per item or 5s default
        indeterminate: false,
      };

      state.loadingCount++;
      state.globalLoading = true;
    },

    startImport: (
      state,
      action: PayloadAction<{
        format: 'csv' | 'json';
        totalItems?: number;
      }>
    ) => {
      const { format, totalItems } = action.payload;
      const id = `import-${format}`;

      state.operations[id] = {
        id,
        name: `Import from ${format.toUpperCase()}`,
        progress: 0,
        status: 'loading',
        message: `Processing ${format.toUpperCase()} import...`,
        startTime: Date.now(),
        estimatedDuration: totalItems ? totalItems * 20 : 10000, // 20ms per item or 10s default
        indeterminate: false,
      };

      state.loadingCount++;
      state.globalLoading = true;
    },
  },
});

export const {
  startOperation,
  updateProgress,
  completeOperation,
  failOperation,
  cancelOperation,
  clearCompletedOperations,
  clearAllOperations,
  startDataLoad,
  startDataSave,
  startExport,
  startImport,
} = progressSlice.actions;

export default progressSlice.reducer;
