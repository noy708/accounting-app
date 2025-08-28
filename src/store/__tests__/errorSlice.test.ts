import errorReducer, {
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
} from '../slices/errorSlice';
import { ErrorState } from '../../types';

const mockError: ErrorState = {
  message: 'Test error',
  type: 'validation',
  field: 'amount',
  retryable: false,
};

const initialState = {
  errors: [],
  globalError: null,
  lastError: null,
  retryQueue: [],
  notifications: [],
};

describe('errorSlice', () => {
  it('should return the initial state', () => {
    expect(errorReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle addError', () => {
    const actual = errorReducer(initialState, addError(mockError));
    expect(actual.errors).toHaveLength(1);
    expect(actual.lastError).toEqual(mockError);
    expect(actual.globalError).toBeNull(); // validation errors don't set global error
  });

  it('should handle addError with system error', () => {
    const systemError: ErrorState = {
      message: 'System error',
      type: 'system',
      retryable: true,
    };

    const actual = errorReducer(initialState, addError(systemError));
    expect(actual.errors).toHaveLength(1);
    expect(actual.lastError).toEqual(systemError);
    expect(actual.globalError).toEqual(systemError);
  });

  it('should handle removeError', () => {
    // First add an error to get the ID
    const stateWithError = errorReducer(initialState, addError(mockError));
    const errorId = (stateWithError.errors[0] as any).id;

    const actual = errorReducer(stateWithError, removeError(errorId));
    expect(actual.errors).toHaveLength(0);
  });

  it('should handle clearErrors', () => {
    const stateWithErrors = errorReducer(initialState, addError(mockError));
    const actual = errorReducer(stateWithErrors, clearErrors());

    expect(actual.errors).toHaveLength(0);
    expect(actual.globalError).toBeNull();
    expect(actual.lastError).toBeNull();
  });

  it('should handle clearErrorsByType', () => {
    const state1 = errorReducer(initialState, addError(mockError));
    const state2 = errorReducer(
      state1,
      addError({ ...mockError, type: 'database' })
    );

    const actual = errorReducer(state2, clearErrorsByType('validation'));

    expect(actual.errors).toHaveLength(1);
    expect((actual.errors[0] as any).type).toBe('database');
  });

  it('should handle clearErrorsByField', () => {
    const state1 = errorReducer(initialState, addError(mockError));
    const state2 = errorReducer(
      state1,
      addError({ ...mockError, field: 'description' })
    );

    const actual = errorReducer(state2, clearErrorsByField('amount'));

    expect(actual.errors).toHaveLength(1);
    expect((actual.errors[0] as any).field).toBe('description');
  });

  it('should handle setGlobalError', () => {
    const actual = errorReducer(initialState, setGlobalError(mockError));
    expect(actual.globalError).toEqual(mockError);
    expect(actual.lastError).toEqual(mockError);
  });

  it('should handle clearGlobalError', () => {
    const stateWithGlobalError = errorReducer(
      initialState,
      setGlobalError(mockError)
    );
    const actual = errorReducer(stateWithGlobalError, clearGlobalError());

    expect(actual.globalError).toBeNull();
  });

  it('should handle addValidationError', () => {
    const actual = errorReducer(
      initialState,
      addValidationError({
        field: 'amount',
        message: 'Amount is required',
      })
    );

    expect(actual.errors).toHaveLength(1);
    expect((actual.errors[0] as any).type).toBe('validation');
    expect((actual.errors[0] as any).field).toBe('amount');
    expect((actual.errors[0] as any).message).toBe('Amount is required');
    expect((actual.errors[0] as any).retryable).toBe(false);
  });

  it('should replace existing validation error for same field', () => {
    const state1 = errorReducer(
      initialState,
      addValidationError({
        field: 'amount',
        message: 'First error',
      })
    );

    const actual = errorReducer(
      state1,
      addValidationError({
        field: 'amount',
        message: 'Second error',
      })
    );

    expect(actual.errors).toHaveLength(1);
    expect((actual.errors[0] as any).message).toBe('Second error');
  });

  it('should handle addDatabaseError', () => {
    const actual = errorReducer(
      initialState,
      addDatabaseError({
        message: 'Database connection failed',
        retryable: true,
      })
    );

    expect(actual.errors).toHaveLength(1);
    expect((actual.errors[0] as any).type).toBe('database');
    expect((actual.errors[0] as any).retryable).toBe(true);
    expect(actual.globalError).toBeTruthy();
  });

  it('should handle addBusinessError', () => {
    const actual = errorReducer(
      initialState,
      addBusinessError({
        message: 'Cannot delete category with transactions',
      })
    );

    expect(actual.errors).toHaveLength(1);
    expect((actual.errors[0] as any).type).toBe('business');
    expect((actual.errors[0] as any).retryable).toBe(false);
  });

  it('should handle addSystemError', () => {
    const actual = errorReducer(
      initialState,
      addSystemError({
        message: 'Unexpected error occurred',
      })
    );

    expect(actual.errors).toHaveLength(1);
    expect((actual.errors[0] as any).type).toBe('system');
    expect((actual.errors[0] as any).retryable).toBe(true);
    expect(actual.globalError).toBeTruthy();
  });

  it('should limit errors to 10 items', () => {
    let state = initialState;

    // Add 12 errors
    for (let i = 0; i < 12; i++) {
      state = errorReducer(
        state,
        addError({
          ...mockError,
          message: `Error ${i}`,
        })
      );
    }

    expect(state.errors).toHaveLength(10);
  });

  describe('retry functionality', () => {
    const mockOriginalAction = { type: 'test/action', payload: { id: '1' } };

    it('should handle addRetryableError', () => {
      const actual = errorReducer(
        initialState,
        addRetryableError({
          originalAction: mockOriginalAction,
          error: mockError,
          maxRetries: 3,
        })
      );

      expect(actual.retryQueue).toHaveLength(1);
      expect(actual.retryQueue[0].originalAction).toEqual(mockOriginalAction);
      expect(actual.retryQueue[0].error).toEqual(mockError);
      expect(actual.retryQueue[0].maxRetries).toBe(3);
      expect(actual.retryQueue[0].retryCount).toBe(0);
    });

    it('should handle incrementRetryCount', () => {
      const stateWithRetry = errorReducer(
        initialState,
        addRetryableError({
          originalAction: mockOriginalAction,
          error: mockError,
        })
      );

      const retryId = stateWithRetry.retryQueue[0].id;
      const actual = errorReducer(stateWithRetry, incrementRetryCount(retryId));

      expect(actual.retryQueue[0].retryCount).toBe(1);
      expect(actual.retryQueue[0].nextRetryAt).toBeGreaterThan(Date.now());
    });

    it('should handle removeFromRetryQueue', () => {
      const stateWithRetry = errorReducer(
        initialState,
        addRetryableError({
          originalAction: mockOriginalAction,
          error: mockError,
        })
      );

      const retryId = stateWithRetry.retryQueue[0].id;
      const actual = errorReducer(
        stateWithRetry,
        removeFromRetryQueue(retryId)
      );

      expect(actual.retryQueue).toHaveLength(0);
    });

    it('should handle clearRetryQueue', () => {
      const state1 = errorReducer(
        initialState,
        addRetryableError({
          originalAction: mockOriginalAction,
          error: mockError,
        })
      );
      const state2 = errorReducer(
        state1,
        addRetryableError({
          originalAction: mockOriginalAction,
          error: { ...mockError, message: 'Another error' },
        })
      );

      const actual = errorReducer(state2, clearRetryQueue());
      expect(actual.retryQueue).toHaveLength(0);
    });
  });

  describe('notification functionality', () => {
    it('should handle addNotification', () => {
      const actual = errorReducer(
        initialState,
        addNotification({
          message: 'Success message',
          type: 'success',
          duration: 5000,
        })
      );

      expect(actual.notifications).toHaveLength(1);
      expect(actual.notifications[0].message).toBe('Success message');
      expect(actual.notifications[0].type).toBe('success');
      expect(actual.notifications[0].duration).toBe(5000);
    });

    it('should handle removeNotification', () => {
      const stateWithNotification = errorReducer(
        initialState,
        addNotification({
          message: 'Test notification',
          type: 'info',
        })
      );

      const notificationId = stateWithNotification.notifications[0].id;
      const actual = errorReducer(
        stateWithNotification,
        removeNotification(notificationId)
      );

      expect(actual.notifications).toHaveLength(0);
    });

    it('should handle clearNotifications', () => {
      const state1 = errorReducer(
        initialState,
        addNotification({
          message: 'Notification 1',
          type: 'info',
        })
      );
      const state2 = errorReducer(
        state1,
        addNotification({
          message: 'Notification 2',
          type: 'success',
        })
      );

      const actual = errorReducer(state2, clearNotifications());
      expect(actual.notifications).toHaveLength(0);
    });

    it('should limit notifications to 20 items', () => {
      let state = initialState;

      // Add 22 notifications
      for (let i = 0; i < 22; i++) {
        state = errorReducer(
          state,
          addNotification({
            message: `Notification ${i}`,
            type: 'info',
          })
        );
      }

      expect(state.notifications).toHaveLength(20);
    });

    it('should handle clearExpiredNotifications', () => {
      // Mock Date.now to control time
      const originalNow = Date.now;
      const mockNow = 1000000;
      Date.now = jest.fn(() => mockNow);

      // Add notifications with different timestamps
      let state = initialState;

      // Add expired notification (older than duration)
      state = errorReducer(
        state,
        addNotification({
          message: 'Expired notification',
          type: 'info',
          duration: 1000,
        })
      );

      // Manually set timestamp to make it expired
      state = {
        ...state,
        notifications: [
          {
            ...state.notifications[0],
            timestamp: new Date(mockNow - 2000).toISOString(),
          },
        ],
      };

      // Add persistent notification
      state = errorReducer(
        state,
        addNotification({
          message: 'Persistent notification',
          type: 'info',
          persistent: true,
        })
      );

      // Add active notification
      state = errorReducer(
        state,
        addNotification({
          message: 'Active notification',
          type: 'info',
          duration: 5000,
        })
      );

      const actual = errorReducer(state, clearExpiredNotifications());

      expect(actual.notifications).toHaveLength(2); // persistent + active
      expect(
        actual.notifications.some((n) => n.message === 'Expired notification')
      ).toBe(false);
      expect(
        actual.notifications.some(
          (n) => n.message === 'Persistent notification'
        )
      ).toBe(true);
      expect(
        actual.notifications.some((n) => n.message === 'Active notification')
      ).toBe(true);

      // Restore Date.now
      Date.now = originalNow;
    });
  });
});
