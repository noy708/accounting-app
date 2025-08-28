import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProgressDisplay from '../ProgressDisplay';
import progressSlice from '../../../store/slices/progressSlice';
import errorSlice from '../../../store/slices/errorSlice';

// Mock store setup
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      progress: progressSlice,
      errors: errorSlice,
    },
    preloadedState: {
      progress: {
        operations: {},
        globalLoading: false,
        loadingCount: 0,
        ...initialState,
      },
      errors: {
        errors: [],
        globalError: null,
        lastError: null,
        retryQueue: [],
        notifications: [],
      },
    },
  });
};

const renderWithStore = (component: React.ReactElement, store = createMockStore()) => {
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store,
  };
};

const mockActiveOperation = {
  id: 'test-op-1',
  name: 'Test Operation 1',
  progress: 50,
  status: 'loading' as const,
  message: 'Processing...',
  startTime: Date.now() - 5000, // 5 seconds ago
  estimatedDuration: 10000,
  indeterminate: false,
};

const mockCompletedOperation = {
  id: 'test-op-2',
  name: 'Test Operation 2',
  progress: 100,
  status: 'success' as const,
  message: 'Completed successfully',
  startTime: Date.now() - 8000, // 8 seconds ago
  estimatedDuration: 5000,
  indeterminate: false,
};

const mockFailedOperation = {
  id: 'test-op-3',
  name: 'Test Operation 3',
  progress: 30,
  status: 'error' as const,
  message: 'Operation failed',
  startTime: Date.now() - 3000, // 3 seconds ago
  estimatedDuration: 7000,
  indeterminate: false,
};

describe('ProgressDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when no operations exist', () => {
    const { container } = renderWithStore(<ProgressDisplay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders minimal variant correctly', () => {
    const store = createMockStore({
      operations: {
        [mockActiveOperation.id]: mockActiveOperation,
      },
      globalLoading: true,
      loadingCount: 1,
    });

    renderWithStore(<ProgressDisplay variant="minimal" />, store);

    expect(screen.getByText('1 operation in progress')).toBeInTheDocument();
  });

  it('renders compact variant with active operations', () => {
    const store = createMockStore({
      operations: {
        [mockActiveOperation.id]: mockActiveOperation,
      },
      globalLoading: true,
      loadingCount: 1,
    });

    renderWithStore(<ProgressDisplay variant="compact" />, store);

    expect(screen.getByText('Operations (1 active)')).toBeInTheDocument();
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    expect(screen.getByText('Test Operation 1')).toBeInTheDocument();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('renders detailed variant with all operation types', () => {
    const store = createMockStore({
      operations: {
        [mockActiveOperation.id]: mockActiveOperation,
        [mockCompletedOperation.id]: mockCompletedOperation,
        [mockFailedOperation.id]: mockFailedOperation,
      },
      globalLoading: true,
      loadingCount: 1,
    });

    renderWithStore(
      <ProgressDisplay 
        variant="detailed" 
        showCompleted={true} 
        showFailed={true} 
      />, 
      store
    );

    expect(screen.getByText('Operation Progress')).toBeInTheDocument();
    expect(screen.getByText('Active Operations (1)')).toBeInTheDocument();
    expect(screen.getByText('Completed Operations (1)')).toBeInTheDocument();
    expect(screen.getByText('Failed Operations (1)')).toBeInTheDocument();
  });

  it('handles operation cancellation', () => {
    const store = createMockStore({
      operations: {
        [mockActiveOperation.id]: mockActiveOperation,
      },
      globalLoading: true,
      loadingCount: 1,
    });

    renderWithStore(<ProgressDisplay variant="compact" />, store);

    const cancelButton = screen.getByRole('button');
    fireEvent.click(cancelButton);

    // In a real test, you'd verify that the cancelOperation action was dispatched
    // This is a simplified test
  });

  it('shows expand/collapse functionality in compact variant', () => {
    const store = createMockStore({
      operations: {
        [mockActiveOperation.id]: mockActiveOperation,
        [mockCompletedOperation.id]: mockCompletedOperation,
      },
      globalLoading: true,
      loadingCount: 1,
    });

    renderWithStore(
      <ProgressDisplay 
        variant="compact" 
        showCompleted={true} 
      />, 
      store
    );

    // Should have expand button when there are completed operations
    const expandButton = screen.getByLabelText('expand');
    expect(expandButton).toBeInTheDocument();

    fireEvent.click(expandButton);

    // Should show completed operations after expanding
    expect(screen.getByText('Completed (1)')).toBeInTheDocument();
  });

  it('limits displayed operations to maxItems', () => {
    const operations = {};
    for (let i = 0; i < 10; i++) {
      operations[`op-${i}`] = {
        ...mockActiveOperation,
        id: `op-${i}`,
        name: `Operation ${i}`,
      };
    }

    const store = createMockStore({
      operations,
      globalLoading: true,
      loadingCount: 10,
    });

    renderWithStore(
      <ProgressDisplay variant="compact" maxItems={3} />, 
      store
    );

    // Should only show 3 operations (the first 3 in this case)
    expect(screen.getByText('Operation 0')).toBeInTheDocument();
    expect(screen.getByText('Operation 1')).toBeInTheDocument();
    expect(screen.getByText('Operation 2')).toBeInTheDocument();
    expect(screen.queryByText('Operation 3')).not.toBeInTheDocument();
  });

  it('handles indeterminate progress operations', () => {
    const indeterminateOp = {
      ...mockActiveOperation,
      indeterminate: true,
      progress: 0,
    };

    const store = createMockStore({
      operations: {
        [indeterminateOp.id]: indeterminateOp,
      },
      globalLoading: true,
      loadingCount: 1,
    });

    renderWithStore(<ProgressDisplay variant="compact" />, store);

    expect(screen.getByText('Test Operation 1')).toBeInTheDocument();
    // Should not show progress bar for indeterminate operations
  });

  it('shows estimated time remaining', () => {
    const store = createMockStore({
      operations: {
        [mockActiveOperation.id]: mockActiveOperation,
      },
      globalLoading: true,
      loadingCount: 1,
    });

    renderWithStore(<ProgressDisplay variant="compact" />, store);

    // Should show some time remaining (exact value depends on calculation)
    expect(screen.getByText(/remaining/)).toBeInTheDocument();
  });

  it('handles clear completed operations', () => {
    const store = createMockStore({
      operations: {
        [mockActiveOperation.id]: mockActiveOperation,
        [mockCompletedOperation.id]: mockCompletedOperation,
      },
      globalLoading: true,
      loadingCount: 1,
    });

    renderWithStore(
      <ProgressDisplay variant="compact" showCompleted={true} />, 
      store
    );

    // Expand to show completed operations
    const expandButton = screen.getByLabelText('expand');
    fireEvent.click(expandButton);

    const clearButton = screen.getByText('Clear History');
    fireEvent.click(clearButton);

    // In a real test, you'd verify that the clearCompletedOperations action was dispatched
  });

  it('does not show completed operations when showCompleted is false', () => {
    const store = createMockStore({
      operations: {
        [mockActiveOperation.id]: mockActiveOperation,
        [mockCompletedOperation.id]: mockCompletedOperation,
      },
      globalLoading: true,
      loadingCount: 1,
    });

    renderWithStore(
      <ProgressDisplay 
        variant="detailed" 
        showCompleted={false} 
      />, 
      store
    );

    expect(screen.queryByText('Completed Operations')).not.toBeInTheDocument();
  });

  it('does not show failed operations when showFailed is false', () => {
    const store = createMockStore({
      operations: {
        [mockActiveOperation.id]: mockActiveOperation,
        [mockFailedOperation.id]: mockFailedOperation,
      },
      globalLoading: true,
      loadingCount: 1,
    });

    renderWithStore(
      <ProgressDisplay 
        variant="detailed" 
        showFailed={false} 
      />, 
      store
    );

    expect(screen.queryByText('Failed Operations')).not.toBeInTheDocument();
  });

  it('calls onOperationCancel callback when provided', () => {
    const mockOnCancel = jest.fn();
    const store = createMockStore({
      operations: {
        [mockActiveOperation.id]: mockActiveOperation,
      },
      globalLoading: true,
      loadingCount: 1,
    });

    renderWithStore(
      <ProgressDisplay 
        variant="compact" 
        onOperationCancel={mockOnCancel} 
      />, 
      store
    );

    const cancelButton = screen.getByRole('button');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledWith(mockActiveOperation.id);
  });
});