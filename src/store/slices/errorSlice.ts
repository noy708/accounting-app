import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ErrorState } from '../../types';

interface ErrorSliceState {
  errors: ErrorState[];
  globalError: ErrorState | null;
  lastError: ErrorState | null;
  retryQueue: RetryableError[];
  notifications: NotificationState[];
}

interface RetryableError {
  id: string;
  originalAction: any;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: number;
  error: ErrorState;
}

interface NotificationState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  timestamp: string;
}

const initialState: ErrorSliceState = {
  errors: [],
  globalError: null,
  lastError: null,
  retryQueue: [],
  notifications: [],
};

const errorSlice = createSlice({
  name: 'errors',
  initialState,
  reducers: {
    // Add error
    addError: (state, action: PayloadAction<ErrorState>) => {
      const error = {
        ...action.payload,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      };
      
      state.errors.push(error as ErrorState & { timestamp: string; id: string });
      state.lastError = action.payload;
      
      // Set as global error if it's a system error
      if (action.payload.type === 'system') {
        state.globalError = action.payload;
      }
      
      // Keep only last 10 errors to prevent memory issues
      if (state.errors.length > 10) {
        state.errors = state.errors.slice(-10);
      }
    },
    
    // Remove specific error
    removeError: (state, action: PayloadAction<string>) => {
      state.errors = state.errors.filter((error: any) => error.id !== action.payload);
      
      // Clear global error if it matches
      if (state.globalError && (state.globalError as any).id === action.payload) {
        state.globalError = null;
      }
    },
    
    // Clear all errors
    clearErrors: (state) => {
      state.errors = [];
      state.globalError = null;
      state.lastError = null;
    },
    
    // Clear errors by type
    clearErrorsByType: (state, action: PayloadAction<ErrorState['type']>) => {
      state.errors = state.errors.filter((error: any) => error.type !== action.payload);
      
      // Clear global error if it matches type
      if (state.globalError && state.globalError.type === action.payload) {
        state.globalError = null;
      }
    },
    
    // Clear errors by field (for validation errors)
    clearErrorsByField: (state, action: PayloadAction<string>) => {
      state.errors = state.errors.filter((error: any) => error.field !== action.payload);
    },
    
    // Set global error
    setGlobalError: (state, action: PayloadAction<ErrorState | null>) => {
      state.globalError = action.payload;
      if (action.payload) {
        state.lastError = action.payload;
      }
    },
    
    // Clear global error
    clearGlobalError: (state) => {
      state.globalError = null;
    },
    
    // Helper actions for common error scenarios
    addValidationError: (state, action: PayloadAction<{ field: string; message: string }>) => {
      const error: ErrorState = {
        message: action.payload.message,
        type: 'validation',
        field: action.payload.field,
        retryable: false,
      };
      
      // Remove existing validation error for the same field
      state.errors = state.errors.filter((e: any) => 
        !(e.type === 'validation' && e.field === action.payload.field)
      );
      
      // Add new validation error
      const errorWithMeta = {
        ...error,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      };
      
      state.errors.push(errorWithMeta as ErrorState & { timestamp: string; id: string });
      state.lastError = error;
    },
    
    addDatabaseError: (state, action: PayloadAction<{ message: string; retryable?: boolean }>) => {
      const error: ErrorState = {
        message: action.payload.message,
        type: 'database',
        retryable: action.payload.retryable ?? true,
      };
      
      const errorWithMeta = {
        ...error,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      };
      
      state.errors.push(errorWithMeta as ErrorState & { timestamp: string; id: string });
      state.lastError = error;
      state.globalError = error;
    },
    
    addBusinessError: (state, action: PayloadAction<{ message: string }>) => {
      const error: ErrorState = {
        message: action.payload.message,
        type: 'business',
        retryable: false,
      };
      
      const errorWithMeta = {
        ...error,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      };
      
      state.errors.push(errorWithMeta as ErrorState & { timestamp: string; id: string });
      state.lastError = error;
    },
    
    addSystemError: (state, action: PayloadAction<{ message: string }>) => {
      const error: ErrorState = {
        message: action.payload.message,
        type: 'system',
        retryable: true,
      };
      
      const errorWithMeta = {
        ...error,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      };
      
      state.errors.push(errorWithMeta as ErrorState & { timestamp: string; id: string });
      state.lastError = error;
      state.globalError = error;
    },
    
    // Retry functionality
    addRetryableError: (state, action: PayloadAction<{
      originalAction: any;
      error: ErrorState;
      maxRetries?: number;
    }>) => {
      const retryableError: RetryableError = {
        id: Date.now().toString(),
        originalAction: action.payload.originalAction,
        retryCount: 0,
        maxRetries: action.payload.maxRetries || 3,
        nextRetryAt: Date.now() + 1000, // 1 second delay
        error: action.payload.error,
      };
      
      state.retryQueue.push(retryableError);
    },
    
    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const retryableError = state.retryQueue.find(r => r.id === action.payload);
      if (retryableError) {
        retryableError.retryCount++;
        retryableError.nextRetryAt = Date.now() + (1000 * Math.pow(2, retryableError.retryCount));
      }
    },
    
    removeFromRetryQueue: (state, action: PayloadAction<string>) => {
      state.retryQueue = state.retryQueue.filter(r => r.id !== action.payload);
    },
    
    clearRetryQueue: (state) => {
      state.retryQueue = [];
    },
    
    // Notification system
    addNotification: (state, action: PayloadAction<{
      message: string;
      type: 'success' | 'error' | 'warning' | 'info';
      duration?: number;
      persistent?: boolean;
    }>) => {
      const notification: NotificationState = {
        id: Date.now().toString(),
        message: action.payload.message,
        type: action.payload.type,
        duration: action.payload.duration,
        persistent: action.payload.persistent,
        timestamp: new Date().toISOString(),
      };
      
      state.notifications.push(notification);
      
      // Keep only last 20 notifications
      if (state.notifications.length > 20) {
        state.notifications = state.notifications.slice(-20);
      }
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    clearExpiredNotifications: (state) => {
      const now = Date.now();
      state.notifications = state.notifications.filter(n => {
        if (n.persistent) return true;
        if (!n.duration) return true;
        const notificationTime = new Date(n.timestamp).getTime();
        return (now - notificationTime) < n.duration;
      });
    },
  },
});

export const {
  addError,
  removeError,
  clearErrors,
  clearErrorsByType,
  clearErrorsByField,
  setGlobalError,
  clearGlobalError,
  addValidationError,
  addDatabaseError,
  addBusinessError,
  addSystemError,
  addRetryableError,
  incrementRetryCount,
  removeFromRetryQueue,
  clearRetryQueue,
  addNotification,
  removeNotification,
  clearNotifications,
  clearExpiredNotifications,
} = errorSlice.actions;

export default errorSlice.reducer;