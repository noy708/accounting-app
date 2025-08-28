import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CategoryManager } from '../CategoryManager';
import { categoryApi } from '../../../store/api/categoryApi';
import { Category } from '../../../types';

// Mock the API
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
];

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      [categoryApi.reducerPath]: categoryApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(categoryApi.middleware),
    preloadedState: initialState,
  });
};

// Mock the API hooks
jest.mock('../../../store/api/categoryApi', () => ({
  ...jest.requireActual('../../../store/api/categoryApi'),
  useGetCategoriesQuery: jest.fn(),
}));

const mockUseGetCategoriesQuery =
  categoryApi.useGetCategoriesQuery as jest.MockedFunction<
    typeof categoryApi.useGetCategoriesQuery
  >;

describe('CategoryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders loading state', () => {
    mockUseGetCategoriesQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      refetch: jest.fn(),
    } as any);

    renderWithProvider(<CategoryManager />);

    expect(screen.getByText('カテゴリを読み込み中...')).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    const mockRefetch = jest.fn();
    mockUseGetCategoriesQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Network error' },
      refetch: mockRefetch,
    } as any);

    renderWithProvider(<CategoryManager />);

    expect(
      screen.getByText('カテゴリの読み込みに失敗しました')
    ).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /再試行/i });
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders categories list when data is loaded', () => {
    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any);

    renderWithProvider(<CategoryManager />);

    expect(screen.getByText('カテゴリ管理')).toBeInTheDocument();
    expect(screen.getByText('食費')).toBeInTheDocument();
    expect(screen.getByText('給与')).toBeInTheDocument();
  });

  it('shows empty state when no categories exist', () => {
    mockUseGetCategoriesQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any);

    renderWithProvider(<CategoryManager />);

    expect(
      screen.getByText(
        'カテゴリがありません。新しいカテゴリを作成してください。'
      )
    ).toBeInTheDocument();
  });

  it('opens create category dialog when add button is clicked', async () => {
    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any);

    renderWithProvider(<CategoryManager />);

    const addButton = screen.getByRole('button', { name: /新しいカテゴリ/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('新しいカテゴリを作成')).toBeInTheDocument();
    });
  });

  it('opens edit category dialog when edit is selected from menu', async () => {
    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any);

    renderWithProvider(<CategoryManager />);

    // Find and click the more options button for the first category
    const moreButtons = screen.getAllByLabelText('more options');
    fireEvent.click(moreButtons[0]);

    // Click edit from the menu
    const editButton = screen.getByText('編集');
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('カテゴリを編集')).toBeInTheDocument();
    });
  });

  it('closes dialog when cancel is clicked', async () => {
    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any);

    renderWithProvider(<CategoryManager />);

    // Open create dialog
    const addButton = screen.getByRole('button', { name: /新しいカテゴリ/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('新しいカテゴリを作成')).toBeInTheDocument();
    });

    // Close dialog
    const cancelButton = screen.getByRole('button', { name: /キャンセル/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText('新しいカテゴリを作成')
      ).not.toBeInTheDocument();
    });
  });

  it('shows floating action button on mobile', () => {
    mockUseGetCategoriesQuery.mockReturnValue({
      data: mockCategories,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any);

    renderWithProvider(<CategoryManager />);

    const fab = screen.getByLabelText('add category');
    expect(fab).toBeInTheDocument();
  });
});
