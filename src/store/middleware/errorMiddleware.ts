import { isRejectedWithValue, Middleware, createListenerMiddleware } from '@reduxjs/toolkit';
import { 
  addError, 
  addDatabaseError, 
  addBusinessError, 
  addSystemError, 
  addValidationError, 
  addRetryableError, 
  incrementRetryCount,
  removeFromRetryQueue
} from '../slices/errorSlice';
import { DatabaseError } from '../../database/connection';
import { ErrorState } from '../../types';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2,
};

/**
 * Enhanced error classification
 */
const classifyError = (error: any): { type: ErrorState['type']; retryable: boolean; message: string } => {
  // Network errors
  if (error?.status === 'FETCH_ERROR' || error?.name === 'NetworkError') {
    return {
      type: 'system',
      retryable: true,
      message: 'ネットワークエラーが発生しました。接続を確認してください。',
    };
  }
  
  // Timeout errors
  if (error?.name === 'TimeoutError' || error?.code === 'TIMEOUT') {
    return {
      type: 'system',
      retryable: true,
      message: 'リクエストがタイムアウトしました。',
    };
  }
  
  // Database errors
  if (error instanceof DatabaseError) {
    return {
      type: error.type,
      retryable: error.retryable,
      message: error.message,
    };
  }
  
  // HTTP status codes
  if (error?.status) {
    const status = error.status;
    if (status >= 500) {
      return {
        type: 'system',
        retryable: true,
        message: 'サーバーエラーが発生しました。しばらく待ってから再試行してください。',
      };
    } else if (status === 429) {
      return {
        type: 'system',
        retryable: true,
        message: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
      };
    } else if (status >= 400) {
      return {
        type: 'validation',
        retryable: false,
        message: 'リクエストに問題があります。入力内容を確認してください。',
      };
    }
  }
  
  // Default classification
  return {
    type: 'system',
    retryable: true,
    message: error?.message || '予期しないエラーが発生しました。',
  };
};

/**
 * RTK Query error handling middleware with enhanced error classification and retry logic
 */
export const rtkQueryErrorLogger: Middleware = (api) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    console.warn('RTK Query error:', action);

    const error = action.payload;
    const { type, retryable, message } = classifyError(error);
    
    // Create error state
    const errorState: ErrorState = {
      message,
      type,
      retryable,
    };
    
    // Add to retry queue if retryable
    if (retryable && shouldRetry(action)) {
      api.dispatch(addRetryableError({
        originalAction: action.meta?.arg,
        error: errorState,
        maxRetries: RETRY_CONFIG.maxRetries,
      }));
    }
    
    // Dispatch appropriate error action
    switch (type) {
      case 'validation':
        api.dispatch(addValidationError({
          field: 'general',
          message,
        }));
        break;
      case 'database':
        api.dispatch(addDatabaseError({
          message,
          retryable,
        }));
        break;
      case 'business':
        api.dispatch(addBusinessError({
          message,
        }));
        break;
      case 'system':
        api.dispatch(addSystemError({
          message,
        }));
        break;
      default:
        api.dispatch(addError(errorState));
    }
  }

  return next(action);
};

/**
 * Determine if an action should be retried
 */
const shouldRetry = (action: any): boolean => {
  // Don't retry certain types of operations
  const nonRetryableEndpoints = ['login', 'logout', 'deleteTransaction', 'deleteCategory'];
  const endpoint = action.meta?.arg?.endpointName;
  
  if (endpoint && nonRetryableEndpoints.includes(endpoint)) {
    return false;
  }
  
  return true;
};

/**
 * Retry middleware that processes the retry queue
 */
export const retryMiddleware: Middleware = (api) => (next) => (action) => {
  const result = next(action);
  
  // Process retry queue periodically
  if (action.type === 'errors/processRetryQueue') {
    const state = api.getState() as any;
    const retryQueue = state.errors.retryQueue;
    const now = Date.now();
    
    retryQueue.forEach((retryableError: any) => {
      if (retryableError.nextRetryAt <= now && retryableError.retryCount < retryableError.maxRetries) {
        // Attempt retry
        console.log(`Retrying action: ${retryableError.originalAction?.type} (attempt ${retryableError.retryCount + 1})`);
        
        // Increment retry count
        api.dispatch(incrementRetryCount(retryableError.id));
        
        // Dispatch original action again
        if (retryableError.originalAction) {
          // This would need to be implemented based on the specific action type
          // For now, we'll just log it
          console.log('Would retry:', retryableError.originalAction);
        }
      } else if (retryableError.retryCount >= retryableError.maxRetries) {
        // Max retries reached, remove from queue and show final error
        api.dispatch(removeFromRetryQueue(retryableError.id));
        api.dispatch(addError({
          message: `${retryableError.error.message} (最大再試行回数に達しました)`,
          type: retryableError.error.type,
          retryable: false,
        }));
      }
    });
  }
  
  return result;
};