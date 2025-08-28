import progressReducer, {
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
} from '../slices/progressSlice';

const initialState = {
  operations: {},
  globalLoading: false,
  loadingCount: 0,
};

describe('progressSlice', () => {
  it('should return the initial state', () => {
    expect(progressReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle startOperation', () => {
    const actual = progressReducer(initialState, startOperation({
      id: 'test-op',
      name: 'Test Operation',
      message: 'Testing...',
      estimatedDuration: 5000,
    }));

    expect(actual.operations['test-op']).toBeDefined();
    expect(actual.operations['test-op'].name).toBe('Test Operation');
    expect(actual.operations['test-op'].status).toBe('loading');
    expect(actual.operations['test-op'].progress).toBe(0);
    expect(actual.globalLoading).toBe(true);
    expect(actual.loadingCount).toBe(1);
  });

  it('should handle updateProgress', () => {
    const stateWithOperation = progressReducer(initialState, startOperation({
      id: 'test-op',
      name: 'Test Operation',
    }));

    const actual = progressReducer(stateWithOperation, updateProgress({
      id: 'test-op',
      progress: 50,
      message: 'Half done',
    }));

    expect(actual.operations['test-op'].progress).toBe(50);
    expect(actual.operations['test-op'].message).toBe('Half done');
  });

  it('should handle completeOperation', () => {
    const stateWithOperation = progressReducer(initialState, startOperation({
      id: 'test-op',
      name: 'Test Operation',
    }));

    const actual = progressReducer(stateWithOperation, completeOperation({
      id: 'test-op',
      message: 'Completed successfully',
    }));

    expect(actual.operations['test-op'].status).toBe('success');
    expect(actual.operations['test-op'].progress).toBe(100);
    expect(actual.operations['test-op'].message).toBe('Completed successfully');
    expect(actual.globalLoading).toBe(false);
    expect(actual.loadingCount).toBe(0);
  });

  it('should handle failOperation', () => {
    const stateWithOperation = progressReducer(initialState, startOperation({
      id: 'test-op',
      name: 'Test Operation',
    }));

    const actual = progressReducer(stateWithOperation, failOperation({
      id: 'test-op',
      message: 'Operation failed',
    }));

    expect(actual.operations['test-op'].status).toBe('error');
    expect(actual.operations['test-op'].message).toBe('Operation failed');
    expect(actual.globalLoading).toBe(false);
    expect(actual.loadingCount).toBe(0);
  });

  it('should handle cancelOperation', () => {
    const stateWithOperation = progressReducer(initialState, startOperation({
      id: 'test-op',
      name: 'Test Operation',
    }));

    const actual = progressReducer(stateWithOperation, cancelOperation('test-op'));

    expect(actual.operations['test-op']).toBeUndefined();
    expect(actual.globalLoading).toBe(false);
    expect(actual.loadingCount).toBe(0);
  });

  it('should handle multiple operations', () => {
    let state = initialState;
    
    state = progressReducer(state, startOperation({
      id: 'op1',
      name: 'Operation 1',
    }));
    
    state = progressReducer(state, startOperation({
      id: 'op2',
      name: 'Operation 2',
    }));

    expect(state.loadingCount).toBe(2);
    expect(state.globalLoading).toBe(true);
    expect(Object.keys(state.operations)).toHaveLength(2);

    // Complete one operation
    state = progressReducer(state, completeOperation({
      id: 'op1',
    }));

    expect(state.loadingCount).toBe(1);
    expect(state.globalLoading).toBe(true);

    // Complete second operation
    state = progressReducer(state, completeOperation({
      id: 'op2',
    }));

    expect(state.loadingCount).toBe(0);
    expect(state.globalLoading).toBe(false);
  });

  it('should handle clearCompletedOperations', () => {
    let state = initialState;
    
    // Add and complete some operations
    state = progressReducer(state, startOperation({
      id: 'op1',
      name: 'Operation 1',
    }));
    
    state = progressReducer(state, startOperation({
      id: 'op2',
      name: 'Operation 2',
    }));
    
    state = progressReducer(state, completeOperation({
      id: 'op1',
    }));
    
    state = progressReducer(state, failOperation({
      id: 'op2',
    }));

    expect(Object.keys(state.operations)).toHaveLength(2);

    const actual = progressReducer(state, clearCompletedOperations());
    expect(Object.keys(actual.operations)).toHaveLength(0);
  });

  it('should handle clearAllOperations', () => {
    let state = initialState;
    
    state = progressReducer(state, startOperation({
      id: 'op1',
      name: 'Operation 1',
    }));
    
    state = progressReducer(state, startOperation({
      id: 'op2',
      name: 'Operation 2',
    }));

    const actual = progressReducer(state, clearAllOperations());
    
    expect(actual.operations).toEqual({});
    expect(actual.loadingCount).toBe(0);
    expect(actual.globalLoading).toBe(false);
  });

  it('should handle startDataLoad', () => {
    const actual = progressReducer(initialState, startDataLoad({
      type: 'transactions',
      message: 'Loading transactions...',
    }));

    expect(actual.operations['load-transactions']).toBeDefined();
    expect(actual.operations['load-transactions'].name).toBe('Loading transactions');
    expect(actual.operations['load-transactions'].indeterminate).toBe(true);
    expect(actual.globalLoading).toBe(true);
  });

  it('should handle startDataSave', () => {
    const actual = progressReducer(initialState, startDataSave({
      type: 'transaction',
      operation: 'create',
      message: 'Creating transaction...',
    }));

    expect(actual.operations['save-transaction-create']).toBeDefined();
    expect(actual.operations['save-transaction-create'].name).toBe('create transaction');
    expect(actual.operations['save-transaction-create'].indeterminate).toBe(false);
    expect(actual.operations['save-transaction-create'].estimatedDuration).toBe(2000);
  });

  it('should handle startExport', () => {
    const actual = progressReducer(initialState, startExport({
      format: 'csv',
      totalItems: 100,
    }));

    expect(actual.operations['export-csv']).toBeDefined();
    expect(actual.operations['export-csv'].name).toBe('Export to CSV');
    expect(actual.operations['export-csv'].estimatedDuration).toBe(1000); // 100 * 10ms
  });

  it('should handle startImport', () => {
    const actual = progressReducer(initialState, startImport({
      format: 'json',
      totalItems: 50,
    }));

    expect(actual.operations['import-json']).toBeDefined();
    expect(actual.operations['import-json'].name).toBe('Import from JSON');
    expect(actual.operations['import-json'].estimatedDuration).toBe(1000); // 50 * 20ms
  });

  it('should clamp progress values', () => {
    const stateWithOperation = progressReducer(initialState, startOperation({
      id: 'test-op',
      name: 'Test Operation',
    }));

    // Test negative progress
    let actual = progressReducer(stateWithOperation, updateProgress({
      id: 'test-op',
      progress: -10,
    }));
    expect(actual.operations['test-op'].progress).toBe(0);

    // Test progress over 100
    actual = progressReducer(stateWithOperation, updateProgress({
      id: 'test-op',
      progress: 150,
    }));
    expect(actual.operations['test-op'].progress).toBe(100);
  });

  it('should not update non-existent operations', () => {
    const actual = progressReducer(initialState, updateProgress({
      id: 'non-existent',
      progress: 50,
    }));

    expect(actual).toEqual(initialState);
  });

  it('should not complete already completed operations', () => {
    let state = initialState;
    
    state = progressReducer(state, startOperation({
      id: 'test-op',
      name: 'Test Operation',
    }));
    
    state = progressReducer(state, completeOperation({
      id: 'test-op',
    }));

    const loadingCountAfterComplete = state.loadingCount;

    // Try to complete again
    const actual = progressReducer(state, completeOperation({
      id: 'test-op',
    }));

    expect(actual.loadingCount).toBe(loadingCountAfterComplete);
  });
});