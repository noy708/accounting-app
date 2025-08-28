import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TransactionList from '../TransactionList';
import { Transaction, Category } from '../../../types';

// Mock the API hooks
jest.mock('../../../store/api/transactionApi', () => ({
  useGetTransactionsQuery: jest.fn(),
  useDeleteTransactionMutation: jest.fn(),
}));

jest.mock('../../../store/api/categoryApi', () => ({
  useGetCategoriesQuery: jest.fn(),
}));

const theme = createTheme();

const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    amount: 1000,
    description: '収入1',
    categoryId: 'cat1',
    type: 'income',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    date: new Date('2024-01-16'),
    amount: -500,
    description: '支出1',
    categoryId: 'cat2',
    type: 'expense',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: '3',
    date: new Date('2024-01-17'),
    amount: 2000,
    description: '収入2',
    categoryId: 'cat1',
    type: 'income',
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
  },
];

const mockCategories: Category[] = [
  {
    id: 'cat1',
    name: '収入カテゴリ',
    color: '#00ff00',
    type: 'income',
    isDefault: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'cat2',
    name: '支出カテゴリ',
    color: '#ff0000',
    type: 'expense',
    isDefault: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

const mockUseGetTransactionsQuery = require('../../../store/api/transactionApi')
  .useGetTransactionsQuery as jest.Mock;
const mockUseDeleteTransactionMutation =
  require('../../../store/api/transactionApi')
    .useDeleteTransactionMutation as jest.Mock;
const mockUseGetCategoriesQuery = require('../../../store/api/categoryApi')
  .useGetCategoriesQuery as jest.Mock;

const renderWithProviders = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('TransactionList', () => {
  const mockDeleteTransaction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseGetTransactionsQuery.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
      error: null,
    });

    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: null,
    });

    mockUseDeleteTransactionMutation.mockReturnValue([
      mockDeleteTransaction,
      { isLoading: false },
    ]);

    mockDeleteTransaction.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('renders transaction list correctly', () => {
    renderWithProviders(<TransactionList />);

    expect(screen.getByText('取引一覧 (3件)')).toBeInTheDocument();
    expect(screen.getByText('収入1')).toBeInTheDocument();
    expect(screen.getByText('支出1')).toBeInTheDocument();
    expect(screen.getByText('収入2')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseGetTransactionsQuery.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    renderWithProviders(<TransactionList />);

    expect(screen.getByText('取引データを読み込み中...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockUseGetTransactionsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: { message: 'API Error' },
    });

    renderWithProviders(<TransactionList />);

    expect(
      screen.getByText('取引データの読み込みに失敗しました')
    ).toBeInTheDocument();
  });

  it('displays empty state when no transactions', () => {
    mockUseGetTransactionsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithProviders(<TransactionList />);

    expect(screen.getByText('取引データがありません')).toBeInTheDocument();
    expect(
      screen.getByText('新しい取引を追加してください')
    ).toBeInTheDocument();
  });

  it('sorts transactions by date in descending order by default', () => {
    renderWithProviders(<TransactionList />);

    const transactionItems = screen.getAllByText(/収入|支出/);
    expect(transactionItems[0]).toHaveTextContent('収入2'); // 2024-01-17
    expect(transactionItems[1]).toHaveTextContent('支出1'); // 2024-01-16
    expect(transactionItems[2]).toHaveTextContent('収入1'); // 2024-01-15
  });

  it('changes sort order when dropdown is changed', async () => {
    renderWithProviders(<TransactionList />);

    const sortSelect = screen.getByLabelText('並び順');
    fireEvent.mouseDown(sortSelect);

    const ascOption = screen.getByText('古い順');
    fireEvent.click(ascOption);

    await waitFor(() => {
      const transactionItems = screen.getAllByText(/収入|支出/);
      expect(transactionItems[0]).toHaveTextContent('収入1'); // 2024-01-15
      expect(transactionItems[1]).toHaveTextContent('支出1'); // 2024-01-16
      expect(transactionItems[2]).toHaveTextContent('収入2'); // 2024-01-17
    });
  });

  it('handles pagination correctly', () => {
    const manyTransactions = Array.from({ length: 25 }, (_, i) => ({
      ...mockTransactions[0],
      id: `transaction-${i}`,
      description: `取引 ${i + 1}`,
      date: new Date(`2024-01-${(i % 30) + 1}`),
    }));

    mockUseGetTransactionsQuery.mockReturnValue({
      data: manyTransactions,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<TransactionList pageSize={10} />);

    expect(screen.getByText('取引一覧 (25件)')).toBeInTheDocument();

    // Should show pagination
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onEditTransaction when edit is clicked', () => {
    const onEditTransaction = jest.fn();

    renderWithProviders(
      <TransactionList onEditTransaction={onEditTransaction} />
    );

    const editButtons = screen.getAllByLabelText('edit');
    fireEvent.click(editButtons[0]);

    expect(onEditTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ description: '収入2' })
    );
  });

  it('opens delete confirmation dialog when delete is clicked', () => {
    renderWithProviders(<TransactionList />);

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('取引の削除')).toBeInTheDocument();
    expect(
      screen.getByText('この取引を削除してもよろしいですか？')
    ).toBeInTheDocument();
  });

  it('deletes transaction when confirmed', async () => {
    renderWithProviders(<TransactionList />);

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    const confirmButton = screen.getByText('削除');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteTransaction).toHaveBeenCalled();
    });
  });

  it('cancels delete when cancel is clicked', () => {
    renderWithProviders(<TransactionList />);

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('取引の削除')).not.toBeInTheDocument();
  });

  it('applies filter correctly', () => {
    const filter = { type: 'income' as const };

    renderWithProviders(<TransactionList filter={filter} />);

    expect(mockUseGetTransactionsQuery).toHaveBeenCalledWith(filter);
  });

  it('adjusts current page when items are deleted', async () => {
    // Create exactly 11 transactions (2 pages with pageSize=10)
    const elevenTransactions = Array.from({ length: 11 }, (_, i) => ({
      ...mockTransactions[0],
      id: `transaction-${i}`,
      description: `取引 ${i + 1}`,
    }));

    mockUseGetTransactionsQuery.mockReturnValue({
      data: elevenTransactions,
      isLoading: false,
      error: null,
    });

    renderWithProviders(<TransactionList pageSize={10} />);

    // Go to page 2
    const page2Button = screen.getByText('2');
    fireEvent.click(page2Button);

    // Delete the only item on page 2
    const deleteButton = screen.getByLabelText('delete');
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByText('削除');
    fireEvent.click(confirmButton);

    // Should automatically go back to page 1
    await waitFor(() => {
      expect(mockDeleteTransaction).toHaveBeenCalled();
    });
  });
});
