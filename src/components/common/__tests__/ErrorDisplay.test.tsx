import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ErrorDisplay from '../ErrorDisplay';
import { ErrorState } from '../../../types';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ErrorDisplay', () => {
  const mockOnClose = jest.fn();
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validationError: ErrorState = {
    message: 'バリデーションエラーです',
    type: 'validation',
    retryable: false,
  };

  const systemError: ErrorState = {
    message: 'システムエラーです',
    type: 'system',
    retryable: true,
  };

  it('renders validation error correctly', () => {
    renderWithTheme(<ErrorDisplay error={validationError} />);

    expect(screen.getByText('入力エラー')).toBeInTheDocument();
    expect(screen.getByText('バリデーションエラーです')).toBeInTheDocument();
  });

  it('renders system error correctly', () => {
    renderWithTheme(<ErrorDisplay error={systemError} />);

    expect(screen.getByText('システムエラー')).toBeInTheDocument();
    expect(screen.getByText('システムエラーです')).toBeInTheDocument();
  });

  it('shows retry button for retryable errors', () => {
    renderWithTheme(<ErrorDisplay error={systemError} onRetry={mockOnRetry} />);

    const retryButton = screen.getByText('再試行');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('hides retry button for non-retryable errors', () => {
    renderWithTheme(
      <ErrorDisplay error={validationError} onRetry={mockOnRetry} />
    );

    expect(screen.queryByText('再試行')).not.toBeInTheDocument();
  });

  it('shows close button when onClose is provided', () => {
    renderWithTheme(
      <ErrorDisplay error={validationError} onClose={mockOnClose} />
    );

    const closeButton = screen.getByLabelText('閉じる');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows details when showDetails is true', () => {
    renderWithTheme(<ErrorDisplay error={systemError} showDetails={true} />);

    const detailsButton = screen.getByLabelText('詳細を表示');
    expect(detailsButton).toBeInTheDocument();

    fireEvent.click(detailsButton);

    expect(screen.getByText('エラー詳細:')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
    expect(screen.getByText('はい')).toBeInTheDocument(); // retryable: true
  });

  it('toggles details expansion', () => {
    renderWithTheme(<ErrorDisplay error={systemError} showDetails={true} />);

    const detailsButton = screen.getByLabelText('詳細を表示');
    fireEvent.click(detailsButton);

    expect(screen.getByText('エラー詳細:')).toBeInTheDocument();

    const closeDetailsButton = screen.getByLabelText('詳細を閉じる');
    fireEvent.click(closeDetailsButton);

    // Check that the button text changed back to "詳細を表示"
    expect(screen.getByLabelText('詳細を表示')).toBeInTheDocument();
  });

  it('uses correct severity for different error types', () => {
    const { rerender } = renderWithTheme(
      <ErrorDisplay error={validationError} />
    );

    // Validation errors should be warnings
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-standardWarning');

    rerender(
      <ThemeProvider theme={theme}>
        <ErrorDisplay error={systemError} />
      </ThemeProvider>
    );

    // System errors should be errors
    expect(screen.getByRole('alert')).toHaveClass('MuiAlert-standardError');
  });

  it('shows field information when available', () => {
    const errorWithField: ErrorState = {
      message: 'フィールドエラー',
      type: 'validation',
      retryable: false,
      field: 'email',
    };

    renderWithTheme(<ErrorDisplay error={errorWithField} showDetails={true} />);

    const detailsButton = screen.getByLabelText('詳細を表示');
    fireEvent.click(detailsButton);

    expect(screen.getByText('email')).toBeInTheDocument();
  });
});
