import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TransactionDeleteDialog from '../TransactionDeleteDialog';
import { transactionApi } from '../../../store/api/transactionApi';
import { Transaction, Category } from '../../../types';

// Mock the API
const mockDeleteTransaction = jest.fn();

jest.mock('../../../store/api/transactionApi', () => ({
  useDeleteTransactionMutation: () => [
    mockDeleteTransaction,
    { isLoading: false, error: null },
  ],
}));

jest.mock('../../common/ErrorDisplay', () => {
  return function MockErrorDisplay({ error }: any) {
    return (
      <div data-testid="error-display">
        {error?.message || 'エラーが発生しました'}
      </div>
    );
  };
});

const mockStore = configureStore({
  reducer: {
    [transactionApi.reducerPath]: transactionApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(transactionApi.middleware),
});

const mockTransaction: Transaction = {
  id: '1',
  date: new Date('2024-01-15'),
  amount: -1000,
  description: 'Test transaction',
  categoryId: 'cat1',
  type: 'expense',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

const mockIncomeTransaction: Transaction = {
  id: '2',
  date: new Date('2024-01-16'),
  amount: 2000,
  description: 'Income transaction',
  categoryId: 'cat2',
  type: 'income',
  createdAt: new Date('2024-01-16'),
  updatedAt: new Date('2024-01-16'),
};

const mockCategory: Category = {
  id: 'cat1',
  name: 'Food',
  color: '#ff0000',
  type: 'expense',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const renderComponent = (
  props: Partial<React.ComponentProps<typeof TransactionDeleteDialog>> = {}
) => {
  const defaultProps = {
    open: true,
    transaction: mockTransaction,
    category: mockCategory,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    ...props,
  };

  return render(
    <Provider store={mockStore}>
      <TransactionDeleteDialog {...defaultProps} />
    </Provider>
  );
};

describe('TransactionDeleteDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteTransaction.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('renders dialog when open', () => {
    renderComponent();

    expect(screen.getByText('取引を削除')).toBeInTheDocument();
    expect(
      screen.getByText(
        '以下の取引を削除してもよろしいですか？この操作は取り消すことができません。'
      )
    ).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderComponent({ open: false });

    expect(screen.queryByText('取引を削除')).not.toBeInTheDocument();
  });

  it('returns null when transaction is null', () => {
    const { container } = renderComponent({ transaction: null });

    expect(container.firstChild).toBeNull();
  });

  it('displays transaction details correctly for expense', () => {
    renderComponent();

    expect(screen.getByText('Test transaction')).toBeInTheDocument();
    expect(screen.getByText('2024/01/15 (月)')).toBeInTheDocument();
    expect(screen.getByText('-¥1,000')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('displays transaction details correctly for income', () => {
    renderComponent({
      transaction: mockIncomeTransaction,
      category: { ...mockCategory, name: 'Salary', type: 'income' },
    });

    expect(screen.getByText('Income transaction')).toBeInTheDocument();
    expect(screen.getByText('2024/01/16 (火)')).toBeInTheDocument();
    expect(screen.getByText('+¥2,000')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('displays transaction without category', () => {
    renderComponent({ category: undefined });

    expect(screen.getByText('Test transaction')).toBeInTheDocument();
    expect(screen.queryByText('Food')).not.toBeInTheDocument();
  });

  it('handles delete confirmation', async () => {
    const onSuccess = jest.fn();
    const onClose = jest.fn();

    renderComponent({ onSuccess, onClose });

    const deleteButton = screen.getByRole('button', { name: '削除' });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteTransaction).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('handles cancel button click', async () => {
    const onClose = jest.fn();

    renderComponent({ onClose });

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    await userEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
    expect(mockDeleteTransaction).not.toHaveBeenCalled();
  });

  it('handles dialog close', async () => {
    const onClose = jest.fn();
    renderComponent({ onClose });

    // Simulate ESC key press to close dialog
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('shows loading state during deletion', () => {
    // Mock the hook to return loading state
    jest.doMock('../../../store/api/transactionApi', () => ({
      useDeleteTransactionMutation: () => [
        mockDeleteTransaction,
        { isLoading: true, error: null },
      ],
    }));

    renderComponent();

    expect(screen.getByText('削除中...')).toBeInTheDocument();

    // Buttons should be disabled during loading
    expect(screen.getByRole('button', { name: '削除中...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
  });

  it('displays error when deletion fails', () => {
    const error = { message: 'Deletion failed' };

    // Mock the hook to return error state
    jest.doMock('../../../store/api/transactionApi', () => ({
      useDeleteTransactionMutation: () => [
        mockDeleteTransaction,
        { isLoading: false, error },
      ],
    }));

    renderComponent();

    expect(screen.getByTestId('error-display')).toBeInTheDocument();
  });

  it('handles deletion error gracefully', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => { });

    mockDeleteTransaction.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error('Network error')),
    });

    renderComponent();

    const deleteButton = screen.getByRole('button', { name: '削除' });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to delete transaction:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  it('formats amount correctly with Japanese locale', () => {
    const largeAmountTransaction = {
      ...mockTransaction,
      amount: -1234567,
    };

    renderComponent({ transaction: largeAmountTransaction });

    expect(screen.getByText('-¥1,234,567')).toBeInTheDocument();
  });

  it('formats date correctly with Japanese weekday', () => {
    // Test different weekdays
    const sundayTransaction = {
      ...mockTransaction,
      date: new Date('2024-01-14'), // Sunday
    };

    renderComponent({ transaction: sundayTransaction });

    expect(screen.getByText('2024/01/14 (日)')).toBeInTheDocument();
  });

  it('shows correct icon for expense transaction', () => {
    renderComponent();

    // Check if expense icon is present (TrendingDown)
    const expenseIcon = document.querySelector(
      '[data-testid="TrendingDownIcon"]'
    );
    expect(expenseIcon).toBeInTheDocument();
  });

  it('shows correct icon for income transaction', () => {
    renderComponent({ transaction: mockIncomeTransaction });

    // Check if income icon is present (TrendingUp)
    const incomeIcon = document.querySelector('[data-testid="TrendingUpIcon"]');
    expect(incomeIcon).toBeInTheDocument();
  });

  it('applies correct color for category chip', () => {
    renderComponent();

    const categoryChip = screen.getByText('Food');
    expect(categoryChip).toHaveStyle({ backgroundColor: '#ff0000' });
  });
});
