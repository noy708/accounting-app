import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Base selectors
export const selectProgressState = (state: RootState) => state.progress;
export const selectOperations = (state: RootState) => state.progress.operations;
export const selectGlobalLoading = (state: RootState) =>
  state.progress.globalLoading;
export const selectLoadingCount = (state: RootState) =>
  state.progress.loadingCount;

// Memoized selectors
export const selectActiveOperations = createSelector(
  [selectOperations],
  (operations) =>
    Object.values(operations).filter((op) => op.status === 'loading')
);

export const selectCompletedOperations = createSelector(
  [selectOperations],
  (operations) =>
    Object.values(operations).filter((op) => op.status === 'success')
);

export const selectFailedOperations = createSelector(
  [selectOperations],
  (operations) =>
    Object.values(operations).filter((op) => op.status === 'error')
);

export const selectOperationById = (id: string) =>
  createSelector([selectOperations], (operations) => operations[id]);

export const selectOperationsByType = createSelector(
  [selectOperations],
  (operations) => {
    const byType: Record<string, any[]> = {
      load: [],
      save: [],
      export: [],
      import: [],
      other: [],
    };

    Object.values(operations).forEach((op) => {
      if (op.id.startsWith('load-')) {
        byType.load.push(op);
      } else if (op.id.startsWith('save-')) {
        byType.save.push(op);
      } else if (op.id.startsWith('export-')) {
        byType.export.push(op);
      } else if (op.id.startsWith('import-')) {
        byType.import.push(op);
      } else {
        byType.other.push(op);
      }
    });

    return byType;
  }
);

export const selectOverallProgress = createSelector(
  [selectActiveOperations],
  (activeOperations) => {
    if (activeOperations.length === 0) return 100;

    const totalProgress = activeOperations.reduce((sum, op) => {
      return sum + (op.indeterminate ? 0 : op.progress);
    }, 0);

    const determinateOps = activeOperations.filter((op) => !op.indeterminate);

    if (determinateOps.length === 0) return 0;

    return totalProgress / determinateOps.length;
  }
);

export const selectEstimatedTimeRemaining = createSelector(
  [selectActiveOperations],
  (activeOperations) => {
    let totalEstimated = 0;
    let hasEstimates = false;

    activeOperations.forEach((op) => {
      if (op.estimatedDuration && !op.indeterminate) {
        const elapsed = Date.now() - op.startTime;
        const progressRatio = op.progress / 100;

        if (progressRatio > 0) {
          const estimatedTotal = elapsed / progressRatio;
          const remaining = Math.max(0, estimatedTotal - elapsed);
          totalEstimated += remaining;
          hasEstimates = true;
        } else if (op.estimatedDuration) {
          totalEstimated += op.estimatedDuration;
          hasEstimates = true;
        }
      }
    });

    return hasEstimates ? totalEstimated : null;
  }
);

export const selectIsOperationActive = (id: string) =>
  createSelector([selectOperations], (operations) => {
    const operation = operations[id];
    return operation && operation.status === 'loading';
  });

export const selectHasActiveOperations = createSelector(
  [selectActiveOperations],
  (activeOperations) => activeOperations.length > 0
);

export const selectOperationStats = createSelector(
  [selectOperations],
  (operations) => {
    const stats = {
      total: 0,
      loading: 0,
      success: 0,
      error: 0,
      idle: 0,
    };

    Object.values(operations).forEach((op) => {
      stats.total++;
      stats[op.status]++;
    });

    return stats;
  }
);
