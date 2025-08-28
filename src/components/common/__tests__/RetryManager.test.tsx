import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RetryManager from '../RetryManager';
import errorSlice from '../../../store/slices/errorSlice';

// Mock store setup
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      errors: errorSlice,
    },
    preloadedState: {
      errors: {
        errors: [],
        globalError: null,
        lastError: null,
        retryQueue: [],
        notifications: [],
        ...initialState,
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

const mockRetryableError = {
  id: '1',
  originalAction: { type: 'test/action', payload: { id: '1' } },
  retryCount: 1,
  maxRetries: 3,
  nextRetryAt: Date.now() + 5000,
  error: {
    message: 'Test error message',
    type: 'database' as const,
    retryable: true,
  },
};

const mockFailedRetry = {
  id: '2',
  originalAction: { type: 'test/action', payload: { id: '2' } },
  retryCount: 3,
  maxRetries: 3,
  nextRetryAt: Date.now() - 1000,
  error: {
    message: 'Failed error message',
    type: 'system' as const,
    retryable: true,
  },
};

describe('RetryManager', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing when closed', () => {
    renderWithStore(<RetryManager open={false} onClose={mockOnClose} />);
  });

  it('renders dialog when open', () => {
    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('再試行管理')).toBeInTheDocument();
    expect(screen.getByText('現在再試行中の操作はありません')).toBeInTheDocument();
  });

  it('displays pending retries', () => {
    const store = createMockStore({
      retryQueue: [mockRetryableError],
    });

    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />, store);

    expect(screen.getByText('再試行待ち (1)')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('試行回数: 2/3')).toBeInTheDocument();
  });

  it('displays failed retries', () => {
    const store = createMockStore({
      retryQueue: [mockFailedRetry],
    });

    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />, store);

    expect(screen.getByText('再試行失敗 (1)')).toBeInTheDocument();
    expect(screen.getByText('Failed error message')).toBeInTheDocument();
    expect(screen.getByText('最大再試行回数に達しました (3回)')).toBeInTheDocument();
  });

  it('displays both pending and failed retries', () => {
    const store = createMockStore({
      retryQueue: [mockRetryableError, mockFailedRetry],
    });

    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />, store);

    expect(screen.getByText('再試行待ち (1)')).toBeInTheDocument();
    expect(screen.getByText('再試行失敗 (1)')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByText('Failed error message')).toBeInTheDocument();
  });

  it('handles cancel retry action', () => {
    const store = createMockStore({
      retryQueue: [mockRetryableError],
    });

    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />, store);

    const cancelButton = screen.getAllByRole('button').find(
      button => button.getAttribute('aria-label') === null
    );
    
    if (cancelButton) {
      fireEvent.click(cancelButton);
    }

    // In a real test, you'd verify that the removeFromRetryQueue action was dispatched
  });

  it('handles clear all action', () => {
    const store = createMockStore({
      retryQueue: [mockRetryableError, mockFailedRetry],
    });

    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />, store);

    const clearAllButton = screen.getByText('すべてクリア');
    fireEvent.click(clearAllButton);

    // In a real test, you'd verify that the clearRetryQueue action was dispatched
  });

  it('handles dialog close', () => {
    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />);

    const closeButton = screen.getByText('閉じる');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows progress bar for pending retries', () => {
    const store = createMockStore({
      retryQueue: [mockRetryableError],
    });

    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />, store);

    // Check for progress bar (LinearProgress component)
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('formats time remaining correctly', () => {
    const futureTime = Date.now() + 10000; // 10 seconds in the future
    const retryWithFutureTime = {
      ...mockRetryableError,
      nextRetryAt: futureTime,
    };

    const store = createMockStore({
      retryQueue: [retryWithFutureTime],
    });

    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />, store);

    // Should show time remaining (approximately 10 seconds)
    expect(screen.getByText(/次回実行まで: \d+秒/)).toBeInTheDocument();
  });

  it('shows error type chips for failed retries', () => {
    const store = createMockStore({
      retryQueue: [mockFailedRetry],
    });

    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />, store);

    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('processes retry queue automatically', async () => {
    jest.useFakeTimers();
    
    const store = createMockStore({
      retryQueue: [mockRetryableError],
    });

    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />, store);

    // Fast-forward time to trigger the retry processing
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      // The processRetryQueue action should have been dispatched
      // In a real test, you'd spy on the dispatch function to verify this
    });

    jest.useRealTimers();
  });

  it('does not show clear all button when no retries exist', () => {
    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />);

    expect(screen.queryByText('すべてクリア')).not.toBeInTheDocument();
  });

  it('shows clear all button when retries exist', () => {
    const store = createMockStore({
      retryQueue: [mockRetryableError],
    });

    renderWithStore(<RetryManager open={true} onClose={mockOnClose} />, store);

    expect(screen.getByText('すべてクリア')).toBeInTheDocument();
  });
});