import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TransactionList from '../TransactionList';

// Mock the API hooks with simple implementations
jest.mock('../../../store/api/transactionApi', () => ({
  useGetTransactionsQuery: () => ({
    data: [
      {
        id: '1',
        date: new Date('2024-01-15'),
        amount: 1000,
        description: '給与',
        categoryId: 'cat1',
        type: 'income',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        date: new Date('2024-01-16'),
        amount: -500,
        description: '食費',
        categoryId: 'cat2',
        type: 'expense',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
      },
    ],
    isLoading: false,
    error: null,
  }),
  useDeleteTransactionMutation: () => [
    jest
      .fn()
      .mockReturnValue({ unwrap: jest.fn().mockResolvedValue(undefined) }),
    { isLoading: false },
  ],
}));

jest.mock('../../../store/api/categoryApi', () => ({
  useGetCategoriesQuery: () => ({
    data: [
      {
        id: 'cat1',
        name: '給与',
        color: '#4caf50',
        type: 'income',
        isDefault: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'cat2',
        name: '食費',
        color: '#ff9800',
        type: 'expense',
        isDefault: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('TransactionList Simple Integration', () => {
  it('renders transaction list with data', () => {
    renderWithTheme(<TransactionList />);

    // Check header
    expect(screen.getByText('取引一覧 (2件)')).toBeInTheDocument();

    // Check transactions are displayed
    expect(screen.getByText('給与')).toBeInTheDocument();
    expect(screen.getByText('食費')).toBeInTheDocument();

    // Check amounts are displayed
    expect(screen.getByText(/\+¥1,000/)).toBeInTheDocument();
    expect(screen.getByText(/-¥500/)).toBeInTheDocument();

    // Check sort control
    expect(screen.getByLabelText('並び順')).toBeInTheDocument();
  });

  it('shows sort options', () => {
    renderWithTheme(<TransactionList />);

    const sortSelect = screen.getByLabelText('並び順');
    fireEvent.mouseDown(sortSelect);

    expect(screen.getByText('新しい順')).toBeInTheDocument();
    expect(screen.getByText('古い順')).toBeInTheDocument();
  });

  it('displays action buttons for transactions', () => {
    renderWithTheme(<TransactionList />);

    // Should have edit and delete buttons for each transaction
    const editButtons = screen.getAllByLabelText('edit');
    const deleteButtons = screen.getAllByLabelText('delete');

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it('opens delete confirmation dialog', () => {
    renderWithTheme(<TransactionList />);

    const deleteButtons = screen.getAllByLabelText('delete');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText('取引の削除')).toBeInTheDocument();
    expect(
      screen.getByText('この取引を削除してもよろしいですか？')
    ).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
    expect(screen.getByText('削除')).toBeInTheDocument();
  });

  it('calls onEditTransaction when provided', () => {
    const onEditTransaction = jest.fn();

    renderWithTheme(<TransactionList onEditTransaction={onEditTransaction} />);

    const editButtons = screen.getAllByLabelText('edit');
    fireEvent.click(editButtons[0]);

    expect(onEditTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '給与',
        amount: 1000,
        type: 'income',
      })
    );
  });
});
