import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Base selectors
export const selectErrorState = (state: RootState) => state.errors;
export const selectErrors = (state: RootState) => state.errors.errors;
export const selectGlobalError = (state: RootState) => state.errors.globalError;
export const selectLastError = (state: RootState) => state.errors.lastError;
export const selectRetryQueue = (state: RootState) => state.errors.retryQueue;
export const selectNotifications = (state: RootState) =>
  state.errors.notifications;

// Memoized selectors
export const selectErrorsByType = createSelector([selectErrors], (errors) => ({
  validation: errors.filter((e: any) => e.type === 'validation'),
  database: errors.filter((e: any) => e.type === 'database'),
  business: errors.filter((e: any) => e.type === 'business'),
  system: errors.filter((e: any) => e.type === 'system'),
}));

export const selectValidationErrors = createSelector([selectErrors], (errors) =>
  errors.filter((e: any) => e.type === 'validation')
);

export const selectRetryableErrors = createSelector([selectErrors], (errors) =>
  errors.filter((e: any) => e.retryable)
);

export const selectErrorsByField = (field: string) =>
  createSelector([selectValidationErrors], (validationErrors) =>
    validationErrors.filter((e: any) => e.field === field)
  );

export const selectHasErrors = createSelector(
  [selectErrors],
  (errors) => errors.length > 0
);

export const selectHasGlobalError = createSelector(
  [selectGlobalError],
  (globalError) => globalError !== null
);

export const selectErrorCount = createSelector(
  [selectErrors],
  (errors) => errors.length
);

export const selectErrorStats = createSelector([selectErrors], (errors) => {
  const stats = errors.reduce(
    (acc: any, error: any) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      if (error.retryable) acc.retryable++;
      return acc;
    },
    { validation: 0, database: 0, business: 0, system: 0, retryable: 0 }
  );

  return {
    ...stats,
    total: errors.length,
  };
});

// Retry queue selectors
export const selectPendingRetries = createSelector(
  [selectRetryQueue],
  (retryQueue) => retryQueue.filter((r) => r.retryCount < r.maxRetries)
);

export const selectFailedRetries = createSelector(
  [selectRetryQueue],
  (retryQueue) => retryQueue.filter((r) => r.retryCount >= r.maxRetries)
);

// Notification selectors
export const selectActiveNotifications = createSelector(
  [selectNotifications],
  (notifications) => {
    const now = Date.now();
    return notifications.filter((n) => {
      if (n.persistent) return true;
      if (!n.duration) return true;
      const notificationTime = new Date(n.timestamp).getTime();
      return now - notificationTime < n.duration;
    });
  }
);

export const selectNotificationsByType = createSelector(
  [selectNotifications],
  (notifications) => ({
    success: notifications.filter((n) => n.type === 'success'),
    error: notifications.filter((n) => n.type === 'error'),
    warning: notifications.filter((n) => n.type === 'warning'),
    info: notifications.filter((n) => n.type === 'info'),
  })
);
