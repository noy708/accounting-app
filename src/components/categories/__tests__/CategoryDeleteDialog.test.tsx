import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategoryDeleteDialog } from '../CategoryDeleteDialog';
import { Category } from '../../../types';

// Mock the API hooks
const mockDeleteCategory = jest.fn();
const mockUseIsCategoryInUseQuery = jest.fn();
const mockUseGetCategoriesQuery = jest.fn();

jest.mock('../../../store/api/categoryApi', () => ({
  useDeleteCategoryMutation: () => [mockDeleteCategory, { isLoading: false }],
  useIsCategoryInUseQuery: mockUseIsCategoryInUseQuery,
  useGetCategoriesQuery: mockUseGetCategoriesQuery,
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

const mockDefaultCategory: Category = {
  id: '2',
  name: 'デフォルト食費',
  color: '#ff5722',
  type: 'expense',
  isDefault: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockReplacementCategories: Category[] = [
  {
    id: '3',
    name: '外食費',
    color: '#ff9800',
    type: 'expense',
    isDefault: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '4',
    name: '雑費',
    color: '#9c27b0',
    type: 'both',
    isDefault: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

describe('CategoryDeleteDialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteCategory.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({}),
    });
  });

  it('does not render when closed', () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: false,
      isLoading: false,
      error: undefined,
    });

    render(
      <CategoryDeleteDialog
        open={false}
        category={mockCategory}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('カテゴリを削除')).not.toBeInTheDocument();
  });

  it('shows loading state while checking usage', () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
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
      screen.getByText('カテゴリの使用状況を確認中...')
    ).toBeInTheDocument();
  });

  it('shows error state when usage check fails', () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Network error' },
    });

    render(
      <CategoryDeleteDialog
        open={true}
        category={mockCategory}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText('カテゴリの使用状況の確認に失敗しました。')
    ).toBeInTheDocument();
  });

  it('shows safe deletion dialog when category is not in use', () => {
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
      screen.getByText('「食費」カテゴリを削除しますか？')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'このカテゴリは取引で使用されていないため、安全に削除できます。'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '削除' })).not.toBeDisabled();
  });

  it('shows warning when category is in use', () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: true,
      isLoading: false,
      error: undefined,
    });

    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockReplacementCategories,
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
      screen.getByText('このカテゴリは取引で使用されています。')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '削除' })).toBeDisabled();
  });

  it('shows replacement category options when category is in use', () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: true,
      isLoading: false,
      error: undefined,
    });

    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockReplacementCategories,
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
      screen.getByText('代替カテゴリを選択してください（将来の機能）:')
    ).toBeInTheDocument();
    expect(
      screen.getByText('※ 取引の移行機能は今後実装予定です')
    ).toBeInTheDocument();
  });

  it('shows warning for default categories', () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: false,
      isLoading: false,
      error: undefined,
    });

    render(
      <CategoryDeleteDialog
        open={true}
        category={mockDefaultCategory}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText(
        'これはデフォルトカテゴリです。削除すると復元できません。'
      )
    ).toBeInTheDocument();
  });

  it('deletes category when not in use and delete is confirmed', async () => {
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

    const deleteButton = screen.getByRole('button', { name: '削除' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteCategory).toHaveBeenCalledWith('1');
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('prevents deletion when category is in use', async () => {
    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: true,
      isLoading: false,
      error: undefined,
    });

    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockReplacementCategories,
      isLoading: false,
    });

    render(
      <CategoryDeleteDialog
        open={true}
        category={mockCategory}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByRole('button', { name: '削除' });
    expect(deleteButton).toBeDisabled();
  });

  it('closes dialog when cancel is clicked', () => {
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

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles deletion errors', async () => {
    const errorMessage = 'Deletion failed';
    mockDeleteCategory.mockReturnValue({
      unwrap: jest.fn().mockRejectedValue(new Error(errorMessage)),
    });

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

    const deleteButton = screen.getByRole('button', { name: '削除' });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(
        screen.getByText('カテゴリの削除に失敗しました')
      ).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows loading state during deletion', () => {
    // Mock loading state
    jest.doMock('../../../store/api/categoryApi', () => ({
      useDeleteCategoryMutation: () => [
        mockDeleteCategory,
        { isLoading: true },
      ],
      useIsCategoryInUseQuery: () => ({
        data: false,
        isLoading: false,
        error: undefined,
      }),
      useGetCategoriesQuery: () => ({
        data: [],
        isLoading: false,
      }),
    }));

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

    expect(screen.getByRole('button', { name: '削除中...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
  });

  it('filters replacement categories correctly', () => {
    const expenseCategory: Category = {
      id: '1',
      name: '食費',
      color: '#ff5722',
      type: 'expense',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const allCategories = [
      expenseCategory, // Should be excluded (same as current)
      {
        id: '2',
        name: '交通費',
        color: '#2196f3',
        type: 'expense', // Should be included
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: '給与',
        color: '#4caf50',
        type: 'income', // Should be excluded (different type)
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '4',
        name: '雑費',
        color: '#9c27b0',
        type: 'both', // Should be included (compatible)
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockUseIsCategoryInUseQuery.mockReturnValue({
      data: true,
      isLoading: false,
      error: undefined,
    });

    mockUseGetCategoriesQuery.mockReturnValue({
      data: allCategories,
      isLoading: false,
    });

    render(
      <CategoryDeleteDialog
        open={true}
        category={expenseCategory}
        onClose={mockOnClose}
      />
    );

    // Should show compatible categories but not the current one or income-only categories
    expect(screen.getByText('交通費 (支出)')).toBeInTheDocument();
    expect(screen.getByText('雑費 (収入・支出)')).toBeInTheDocument();
    expect(screen.queryByText('給与 (収入)')).not.toBeInTheDocument();
  });
});
