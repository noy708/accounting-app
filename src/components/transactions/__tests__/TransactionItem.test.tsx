import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TransactionItem from '../TransactionItem';
import { Transaction, Category } from '../../../types';

const theme = createTheme();

const mockTransaction: Transaction = {
  id: '1',
  date: new Date('2024-01-15'),
  amount: 1000,
  description: 'テスト取引',
  categoryId: 'cat1',
  type: 'income',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

const mockExpenseTransaction: Transaction = {
  id: '2',
  date: new Date('2024-01-16'),
  amount: -500,
  description: 'テスト支出',
  categoryId: 'cat2',
  type: 'expense',
  createdAt: new Date('2024-01-16'),
  updatedAt: new Date('2024-01-16'),
};

const mockCategory: Category = {
  id: 'cat1',
  name: 'テストカテゴリ',
  color: '#ff0000',
  type: 'income',
  isDefault: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('TransactionItem', () => {
  it('renders income transaction correctly', () => {
    renderWithTheme(
      <TransactionItem transaction={mockTransaction} category={mockCategory} />
    );

    expect(screen.getByText('テスト取引')).toBeInTheDocument();
    expect(screen.getByText('テストカテゴリ')).toBeInTheDocument();
    expect(screen.getByText(/2024\/01\/15.*\+¥1,000/)).toBeInTheDocument();
  });

  it('renders expense transaction correctly', () => {
    const expenseCategory: Category = {
      ...mockCategory,
      id: 'cat2',
      name: '支出カテゴリ',
      type: 'expense',
    };

    renderWithTheme(
      <TransactionItem
        transaction={mockExpenseTransaction}
        category={expenseCategory}
      />
    );

    expect(screen.getByText('テスト支出')).toBeInTheDocument();
    expect(screen.getByText('支出カテゴリ')).toBeInTheDocument();
    expect(screen.getByText(/2024\/01\/16.*-¥500/)).toBeInTheDocument();
  });

  it('renders without category', () => {
    renderWithTheme(<TransactionItem transaction={mockTransaction} />);

    expect(screen.getByText('テスト取引')).toBeInTheDocument();
    expect(screen.queryByText('テストカテゴリ')).not.toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();

    renderWithTheme(
      <TransactionItem
        transaction={mockTransaction}
        category={mockCategory}
        onEdit={onEdit}
      />
    );

    const editButton = screen.getByLabelText('edit');
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockTransaction);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();

    renderWithTheme(
      <TransactionItem
        transaction={mockTransaction}
        category={mockCategory}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByLabelText('delete');
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockTransaction);
  });

  it('does not render action buttons when handlers are not provided', () => {
    renderWithTheme(
      <TransactionItem transaction={mockTransaction} category={mockCategory} />
    );

    expect(screen.queryByLabelText('edit')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('delete')).not.toBeInTheDocument();
  });

  it('displays correct icon for income transaction', () => {
    renderWithTheme(
      <TransactionItem transaction={mockTransaction} category={mockCategory} />
    );

    // Check for TrendingUp icon (income)
    const incomeIcon = screen.getByTestId('TrendingUpIcon');
    expect(incomeIcon).toBeInTheDocument();
  });

  it('displays correct icon for expense transaction', () => {
    renderWithTheme(
      <TransactionItem
        transaction={mockExpenseTransaction}
        category={mockCategory}
      />
    );

    // Check for TrendingDown icon (expense)
    const expenseIcon = screen.getByTestId('TrendingDownIcon');
    expect(expenseIcon).toBeInTheDocument();
  });

  it('formats amount correctly for large numbers', () => {
    const largeTransaction: Transaction = {
      ...mockTransaction,
      amount: 1234567,
    };

    renderWithTheme(
      <TransactionItem transaction={largeTransaction} category={mockCategory} />
    );

    expect(screen.getByText(/\+¥1,234,567/)).toBeInTheDocument();
  });

  it('handles negative expense amounts correctly', () => {
    const negativeExpenseTransaction: Transaction = {
      ...mockExpenseTransaction,
      amount: -1500,
    };

    renderWithTheme(
      <TransactionItem
        transaction={negativeExpenseTransaction}
        category={mockCategory}
      />
    );

    expect(screen.getByText(/-¥1,500/)).toBeInTheDocument();
  });
});
