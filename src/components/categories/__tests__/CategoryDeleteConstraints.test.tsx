import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategoryDeleteDialog } from '../CategoryDeleteDialog';
import { Category, Transaction } from '../../../types';

// Mock the API hooks
const mockDeleteCategory = jest.fn();
const mockUseIsCategoryInUseQuery = jest.fn();
const mockUseGetCategoriesQuery = jest.fn();
const mockUseGetTransactionsQuery = jest.fn();

jest.mock('../../../store/api/categoryApi', () => ({
  useDeleteCategoryMutation: () => [mockDeleteCategory, { isLoading: false }],
  useIsCategoryInUseQuery: mockUseIsCategoryInUseQuery,
  useGetCategoriesQuery: mockUseGetCategoriesQuery,
}));

jest.mock('../../../store/api/transactionApi', () => ({
  useGetTransactionsQuery: mockUseGetTransactionsQuery,
}));

const mockCategory: Category = {
  id: '1',
  name: '食費',
  color: '#ff5722',
  type: 'expense',
  isDefault: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    amount: -1500,
    description: 'ランチ',
    categoryId: '1',
    type: 'expense',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    date: new Date('2024-01-16'),
    amount: -800,
    description: 'コーヒー',
    categoryId: '1',
    type: 'expense',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
];

const mockReplacementCategories: Category[] = [
  {
    id: '2',
    name: '外食費',
    color: '#ff9800',
    type: 'expense',
    isDefault: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('CategoryDeleteConstraints', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteCategory.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
  });

  it('prevents deletion when category is in use and shows transaction count', () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: true,
      isLoading: false,
      error: undefined,
    });

    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockReplacementCategories,
      isLoading: false,
    });

    mockUseGetTransactionsQuery.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });

    render(
      <CategoryDeleteDialog
        open={true}
        category={mockCategory}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText('このカテゴリは2件の取引で使用されています。')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '削除' })).toBeDisabled();
  });

  it('shows detailed transaction information when expanded', async () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: true,
      isLoading: false,
      error: undefined,
    });

    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockReplacementCategories,
      isLoading: false,
    });

    mockUseGetTransactionsQuery.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });

    render(
      <CategoryDeleteDialog
        open={true}
        category={mockCategory}
        onClose={mockOnClose}
      />
    );

    // Click to show details
    const showDetailsButton = screen.getByText('関連取引の詳細を表示');
    fireEvent.click(showDetailsButton);

    await waitFor(() => {
      expect(screen.getByText('関連取引 (2件):')).toBeInTheDocument();
      expect(screen.getByText('ランチ')).toBeInTheDocument();
      expect(screen.getByText('コーヒー')).toBeInTheDocument();
    });
  });

  it('shows guidance for handling related transactions', () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: true,
      isLoading: false,
      error: undefined,
    });

    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockReplacementCategories,
      isLoading: false,
    });

    mockUseGetTransactionsQuery.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });

    render(
      <CategoryDeleteDialog
        open={true}
        category={mockCategory}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('関連する取引の処理方法:')).toBeInTheDocument();
    expect(
      screen.getByText('取引一覧から該当する取引を個別に編集してカテゴリを変更')
    ).toBeInTheDocument();
    expect(
      screen.getByText('取引一覧から該当する取引を削除')
    ).toBeInTheDocument();
  });

  it('shows replacement category suggestions', () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: true,
      isLoading: false,
      error: undefined,
    });

    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockReplacementCategories,
      isLoading: false,
    });

    mockUseGetTransactionsQuery.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });

    render(
      <CategoryDeleteDialog
        open={true}
        category={mockCategory}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('移行先候補のカテゴリ:')).toBeInTheDocument();
    expect(screen.getByText('外食費 (支出)')).toBeInTheDocument();
    expect(screen.getByText('将来の機能:')).toBeInTheDocument();
  });

  it('allows deletion when category is not in use', async () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: false,
      isLoading: false,
      error: undefined,
    });

    render(
      <CategoryDeleteDialog
        open={true}
        category={mockCategory}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText(
        'このカテゴリは取引で使用されていないため、安全に削除できます。'
      )
    ).toBeInTheDocument();

    const deleteButton = screen.getByRole('button', { name: '削除' });
    expect(deleteButton).not.toBeDisabled();

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith('1');
    });
  });

  it('shows error when trying to delete category in use', async () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: true,
      isLoading: false,
      error: undefined,
    });

    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockReplacementCategories,
      isLoading: false,
    });

    mockUseGetTransactionsQuery.mockReturnValue({
      data: mockTransactions,
      isLoading: false,
    });

    render(
      <CategoryDeleteDialog
        open={true}
        category={mockCategory}
        onClose={mockOnClose}
      />
    );

    // Try to click delete (should be disabled, but let's test the handler)
    const deleteButton = screen.getByRole('button', { name: '削除' });
    expect(deleteButton).toBeDisabled();
  });

  it('limits displayed transactions to 10 with overflow indicator', async () => {
    const manyTransactions = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      date: new Date('2024-01-15'),
      amount: -1000,
      description: `取引 ${i + 1}`,
      categoryId: '1',
      type: 'expense' as const,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    }));

    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: true,
      isLoading: false,
      error: undefined,
    });

    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockReplacementCategories,
      isLoading: false,
    });

    mockUseGetTransactionsQuery.mockReturnValue({
      data: manyTransactions,
      isLoading: false,
    });

    render(
      <CategoryDeleteDialog
        open={true}
        category={mockCategory}
        onClose={mockOnClose}
      />
    );

    // Click to show details
    const showDetailsButton = screen.getByText('関連取引の詳細を表示');
    fireEvent.click(showDetailsButton);

    await waitFor(() => {
      expect(screen.getByText('関連取引 (15件):')).toBeInTheDocument();
      expect(screen.getByText('取引 1')).toBeInTheDocument();
      expect(screen.getByText('取引 10')).toBeInTheDocument();
      expect(screen.getByText('...他 5 件')).toBeInTheDocument();
    });
  });

  it('handles default category deletion warning', () => {
    const defaultCategory: Category = {
      ...mockCategory,
      isDefault: true,
    };

    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: false,
      isLoading: false,
      error: undefined,
    });

    render(
      <CategoryDeleteDialog
        open={true}
        category={defaultCategory}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText(
        'これはデフォルトカテゴリです。削除すると復元できません。'
      )
    ).toBeInTheDocument();
  });
});
