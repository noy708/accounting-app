import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategoryList } from '../CategoryList';
import { Category } from '../../../types';

// Mock the CategoryDeleteDialog component
jest.mock('../CategoryDeleteDialog', () => ({
  CategoryDeleteDialog: ({ open, category, onClose }: any) =>
    open ? (
      <div data-testid="delete-dialog">
        <p>Delete {category?.name}?</p>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

const mockCategories: Category[] = [
  {
    id: '1',
    name: '食費',
    color: '#ff5722',
    type: 'expense',
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: '給与',
    color: '#4caf50',
    type: 'income',
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: '交通費',
    color: '#2196f3',
    type: 'expense',
    isDefault: false,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '4',
    name: '雑費',
    color: '#9c27b0',
    type: 'both',
    isDefault: false,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

describe('CategoryList', () => {
  const mockOnEditCategory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no categories provided', () => {
    render(
      <CategoryList categories={[]} onEditCategory={mockOnEditCategory} />
    );

    expect(
      screen.getByText(
        'カテゴリがありません。新しいカテゴリを作成してください。'
      )
    ).toBeInTheDocument();
  });

  it('renders categories grouped by type', () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
      />
    );

    // Check type headers
    expect(screen.getByText('収入カテゴリ')).toBeInTheDocument();
    expect(screen.getByText('支出カテゴリ')).toBeInTheDocument();
    expect(screen.getByText('収入・支出カテゴリ')).toBeInTheDocument();

    // Check category names
    expect(screen.getByText('食費')).toBeInTheDocument();
    expect(screen.getByText('給与')).toBeInTheDocument();
    expect(screen.getByText('交通費')).toBeInTheDocument();
    expect(screen.getByText('雑費')).toBeInTheDocument();
  });

  it('displays category information correctly', () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
      />
    );

    // Check for default category chip
    const defaultChips = screen.getAllByText('デフォルト');
    expect(defaultChips).toHaveLength(2); // 食費 and 給与 are default

    // Check for type chips
    expect(screen.getByText('収入')).toBeInTheDocument();
    expect(screen.getAllByText('支出')).toHaveLength(2); // 食費 and 交通費
    expect(screen.getByText('収入・支出')).toBeInTheDocument();

    // Check creation dates (using getAllByText since there are multiple dates)
    const dates2024_1_1 = screen.getAllByText('作成日: 2024/1/1');
    expect(dates2024_1_1.length).toBe(2); // 食費 and 給与 both have this date
    expect(screen.getByText('作成日: 2024/1/2')).toBeInTheDocument();
    expect(screen.getByText('作成日: 2024/1/3')).toBeInTheDocument();
  });

  it('opens context menu when more options button is clicked', async () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
      />
    );

    const moreButtons = screen.getAllByLabelText('more options');
    fireEvent.click(moreButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('編集')).toBeInTheDocument();
      expect(screen.getByText('削除')).toBeInTheDocument();
    });
  });

  it('calls onEditCategory when edit is clicked from menu', async () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
      />
    );

    const moreButtons = screen.getAllByLabelText('more options');
    fireEvent.click(moreButtons[0]);

    await waitFor(() => {
      const editButton = screen.getByText('編集');
      fireEvent.click(editButton);
    });

    // The first category in the rendered list is actually the income category (給与)
    // because categories are grouped by type and income comes first
    expect(mockOnEditCategory).toHaveBeenCalledWith(mockCategories[1]); // 給与
  });

  it('opens delete dialog when delete is clicked from menu', async () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
      />
    );

    const moreButtons = screen.getAllByLabelText('more options');
    fireEvent.click(moreButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('削除');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });
  });

  it('closes context menu when clicked outside', async () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
      />
    );

    const moreButtons = screen.getAllByLabelText('more options');
    fireEvent.click(moreButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('編集')).toBeInTheDocument();
    });

    // Click on the first category item to close the menu
    const categoryItems = screen.getAllByText('給与');
    fireEvent.click(categoryItems[0]);

    // Menu should close after a short delay
    await waitFor(
      () => {
        expect(screen.queryByText('編集')).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('closes delete dialog when close button is clicked', async () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
      />
    );

    // Open context menu and click delete
    const moreButtons = screen.getAllByLabelText('more options');
    fireEvent.click(moreButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('削除');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    // Close the dialog
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
    });
  });

  it('displays categories in correct type sections', () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
      />
    );

    // Income section should have 給与
    const incomeSection = screen.getByText('収入カテゴリ').closest('div');
    expect(incomeSection).toHaveTextContent('給与');

    // Expense section should have 食費 and 交通費
    const expenseSection = screen.getByText('支出カテゴリ').closest('div');
    expect(expenseSection).toHaveTextContent('食費');
    expect(expenseSection).toHaveTextContent('交通費');

    // Both section should have 雑費
    const bothSection = screen.getByText('収入・支出カテゴリ').closest('div');
    expect(bothSection).toHaveTextContent('雑費');
  });

  it('shows color indicators for categories', () => {
    render(
      <CategoryList
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
      />
    );

    // Check that color icons are present (we can't easily test the actual colors)
    const colorIcons = screen.getAllByTestId('CircleIcon');
    expect(colorIcons.length).toBeGreaterThan(0);
  });
});
