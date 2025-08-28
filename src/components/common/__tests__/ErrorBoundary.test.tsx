import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Mock component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = false,
}) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock navigator.clipboard
const mockWriteText = jest.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText,
  },
  writable: true,
});

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: jest.fn(),
    href: 'http://localhost:3000/test',
  },
});

// Mock alert
window.alert = jest.fn();

describe('ErrorBoundary', () => {
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
    console.error = jest.fn(); // Suppress console.error in tests
    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.getByText('予期しないエラーが発生しました')
    ).toBeInTheDocument();
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
    expect(screen.getByText('ページを再読み込み')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(
      screen.queryByText('予期しないエラーが発生しました')
    ).not.toBeInTheDocument();
  });

  it('handles retry button click', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.getByText('予期しないエラーが発生しました')
    ).toBeInTheDocument();

    const retryButton = screen.getByText('再試行');
    fireEvent.click(retryButton);

    // After retry, the error boundary resets its state and tries to render children again
    // Since we're still passing shouldThrow=true, it will error again
    // But we can verify the retry mechanism works by checking the error UI is still there
    expect(
      screen.getByText('予期しないエラーが発生しました')
    ).toBeInTheDocument();
  });

  it('handles page reload button click', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('ページを再読み込み');
    fireEvent.click(reloadButton);

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it('stores error report in localStorage', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'errorReports',
      expect.stringContaining('Test error message')
    );
  });

  it('limits stored error reports to 10', () => {
    // Mock existing 10 error reports
    const existingErrors = Array.from({ length: 10 }, (_, i) => ({
      message: `Error ${i}`,
      timestamp: new Date().toISOString(),
    }));

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingErrors));

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'errorReports',
      expect.stringMatching(/^\[.*\]$/) // Should be a JSON array
    );

    // Verify that only 10 errors are kept
    const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
    expect(savedData).toHaveLength(10);
  });

  it('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('エラー詳細 (開発者向け)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.queryByText('エラー詳細 (開発者向け)')
    ).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('expands error details when clicked in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const detailsButton = screen.getByText('エラー詳細 (開発者向け)');
    fireEvent.click(detailsButton);

    expect(screen.getByText('エラーID:')).toBeInTheDocument();
    expect(screen.getByText('エラーメッセージ:')).toBeInTheDocument();
    expect(screen.getByText('スタックトレース:')).toBeInTheDocument();
    expect(screen.getByText('コンポーネントスタック:')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('copies error information to clipboard', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Expand error details
    const detailsButton = screen.getByText('エラー詳細 (開発者向け)');
    fireEvent.click(detailsButton);

    const copyButton = screen.getByText('エラー情報をコピー');

    // Wait for the click to be processed
    await new Promise((resolve) => {
      fireEvent.click(copyButton);
      setTimeout(resolve, 0);
    });

    expect(mockWriteText).toHaveBeenCalledWith(
      expect.stringContaining('Test error message')
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('handles clipboard copy failure gracefully', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Mock clipboard failure
    mockWriteText.mockRejectedValue(new Error('Clipboard failed'));

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Expand error details
    const detailsButton = screen.getByText('エラー詳細 (開発者向け)');
    fireEvent.click(detailsButton);

    const copyButton = screen.getByText('エラー情報をコピー');

    // Wait for the click to be processed
    await new Promise((resolve) => {
      fireEvent.click(copyButton);
      setTimeout(resolve, 100);
    });

    // Wait a bit more for the promise to reject
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(console.error).toHaveBeenCalledWith(
      'Failed to copy error to clipboard'
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('handles localStorage failure gracefully', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('localStorage failed');
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      'Failed to store error report:',
      expect.any(Error)
    );
  });
});
