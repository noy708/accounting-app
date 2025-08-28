import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DefaultCategorySetup } from '../DefaultCategorySetup';

// Mock the useDefaultCategories hook
const mockUseDefaultCategories = jest.fn();

jest.mock('../../../hooks/useDefaultCategories', () => ({
  useDefaultCategories: () => mockUseDefaultCategories(),
}));

const mockTemplates = {
  expense: [
    { name: '食費', color: '#FF6B6B', description: '食事、食材、外食など' },
    {
      name: '交通費',
      color: '#4ECDC4',
      description: '電車、バス、タクシー、ガソリンなど',
    },
    { name: '光熱費', color: '#45B7D1', description: '電気、ガス、水道など' },
    {
      name: '通信費',
      color: '#96CEB4',
      description: '携帯電話、インターネット、郵送料など',
    },
    {
      name: '医療費',
      color: '#FFEAA7',
      description: '病院、薬局、健康関連など',
    },
  ],
  income: [
    { name: '給与', color: '#2ECC71', description: '会社からの給与、賞与など' },
    {
      name: '副業',
      color: '#27AE60',
      description: 'アルバイト、フリーランス収入など',
    },
    { name: '投資', color: '#16A085', description: '株式、投資信託、配当など' },
  ],
};

describe('DefaultCategorySetup', () => {
  const mockForceCreateDefaults = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when categories exist and initialized', () => {
    mockUseDefaultCategories.mockReturnValue({
      categories: [{ id: '1', name: '食費' }],
      isInitializing: false,
      initializationError: null,
      forceCreateDefaults: mockForceCreateDefaults,
      getDefaultTemplates: () => mockTemplates,
      isInitialized: true,
    });

    const { container } = render(<DefaultCategorySetup />);
    expect(container.firstChild).toBeNull();
  });

  it('renders setup UI when no categories exist', () => {
    mockUseDefaultCategories.mockReturnValue({
      categories: [],
      isInitializing: false,
      initializationError: null,
      forceCreateDefaults: mockForceCreateDefaults,
      getDefaultTemplates: () => mockTemplates,
      isInitialized: false,
    });

    render(<DefaultCategorySetup />);

    expect(
      screen.getByText('デフォルトカテゴリのセットアップ')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '家計管理を始めるために、よく使われるカテゴリを自動で作成できます。'
      )
    ).toBeInTheDocument();
  });

  it('displays expense and income category previews', () => {
    mockUseDefaultCategories.mockReturnValue({
      categories: [],
      isInitializing: false,
      initializationError: null,
      forceCreateDefaults: mockForceCreateDefaults,
      getDefaultTemplates: () => mockTemplates,
      isInitialized: false,
    });

    render(<DefaultCategorySetup />);

    expect(screen.getByText('支出カテゴリ')).toBeInTheDocument();
    expect(screen.getByText('収入カテゴリ')).toBeInTheDocument();
    expect(screen.getByText('5個のカテゴリ')).toBeInTheDocument();
    expect(screen.getByText('3個のカテゴリ')).toBeInTheDocument();

    // Check some category chips
    expect(screen.getByText('食費')).toBeInTheDocument();
    expect(screen.getByText('交通費')).toBeInTheDocument();
    expect(screen.getByText('給与')).toBeInTheDocument();
    expect(screen.getByText('副業')).toBeInTheDocument();
  });

  it('shows loading state when initializing', () => {
    mockUseDefaultCategories.mockReturnValue({
      categories: [],
      isInitializing: true,
      initializationError: null,
      forceCreateDefaults: mockForceCreateDefaults,
      getDefaultTemplates: () => mockTemplates,
      isInitialized: false,
    });

    render(<DefaultCategorySetup />);

    expect(
      screen.getByText('デフォルトカテゴリを作成中...')
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error message when initialization fails', () => {
    const errorMessage = 'データベースエラーが発生しました';
    mockUseDefaultCategories.mockReturnValue({
      categories: [],
      isInitializing: false,
      initializationError: errorMessage,
      forceCreateDefaults: mockForceCreateDefaults,
      getDefaultTemplates: () => mockTemplates,
      isInitialized: false,
    });

    render(<DefaultCategorySetup />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('calls forceCreateDefaults when create button is clicked', async () => {
    mockUseDefaultCategories.mockReturnValue({
      categories: [],
      isInitializing: false,
      initializationError: null,
      forceCreateDefaults: mockForceCreateDefaults,
      getDefaultTemplates: () => mockTemplates,
      isInitialized: false,
    });

    render(<DefaultCategorySetup />);

    const createButton = screen.getByText('デフォルトカテゴリを作成');
    fireEvent.click(createButton);

    expect(mockForceCreateDefaults).toHaveBeenCalled();
  });

  it('opens and closes template details dialog', async () => {
    mockUseDefaultCategories.mockReturnValue({
      categories: [],
      isInitializing: false,
      initializationError: null,
      forceCreateDefaults: mockForceCreateDefaults,
      getDefaultTemplates: () => mockTemplates,
      isInitialized: false,
    });

    render(<DefaultCategorySetup />);

    // Open dialog
    const detailsButton = screen.getByText('詳細を確認');
    fireEvent.click(detailsButton);

    await waitFor(() => {
      expect(screen.getByText('デフォルトカテゴリの詳細')).toBeInTheDocument();
    });

    // Check detailed content
    expect(screen.getByText('支出カテゴリ (5個)')).toBeInTheDocument();
    expect(screen.getByText('収入カテゴリ (3個)')).toBeInTheDocument();
    expect(screen.getByText('食事、食材、外食など')).toBeInTheDocument();
    expect(screen.getByText('会社からの給与、賞与など')).toBeInTheDocument();

    // Close dialog
    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText('デフォルトカテゴリの詳細')
      ).not.toBeInTheDocument();
    });
  });

  it('creates defaults from dialog', async () => {
    mockUseDefaultCategories.mockReturnValue({
      categories: [],
      isInitializing: false,
      initializationError: null,
      forceCreateDefaults: mockForceCreateDefaults,
      getDefaultTemplates: () => mockTemplates,
      isInitialized: false,
    });

    render(<DefaultCategorySetup />);

    // Open dialog
    const detailsButton = screen.getByText('詳細を確認');
    fireEvent.click(detailsButton);

    await waitFor(() => {
      expect(screen.getByText('デフォルトカテゴリの詳細')).toBeInTheDocument();
    });

    // Click create from dialog
    const createButtons = screen.getAllByText('作成する');
    fireEvent.click(createButtons[0]); // First one is in the dialog

    expect(mockForceCreateDefaults).toHaveBeenCalled();
  });

  it('disables buttons when initializing', () => {
    mockUseDefaultCategories.mockReturnValue({
      categories: [],
      isInitializing: true,
      initializationError: null,
      forceCreateDefaults: mockForceCreateDefaults,
      getDefaultTemplates: () => mockTemplates,
      isInitialized: false,
    });

    render(<DefaultCategorySetup />);

    // Should not show buttons when initializing
    expect(
      screen.queryByText('デフォルトカテゴリを作成')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('詳細を確認')).not.toBeInTheDocument();
  });

  it('shows overflow indicator for many expense categories', () => {
    const manyExpenseTemplates = {
      expense: Array.from({ length: 10 }, (_, i) => ({
        name: `カテゴリ${i + 1}`,
        color: '#FF6B6B',
        description: `説明${i + 1}`,
      })),
      income: mockTemplates.income,
    };

    mockUseDefaultCategories.mockReturnValue({
      categories: [],
      isInitializing: false,
      initializationError: null,
      forceCreateDefaults: mockForceCreateDefaults,
      getDefaultTemplates: () => manyExpenseTemplates,
      isInitialized: false,
    });

    render(<DefaultCategorySetup />);

    expect(screen.getByText('+6個')).toBeInTheDocument(); // Shows overflow for expense categories
  });

  it('shows informational alert in dialog', async () => {
    mockUseDefaultCategories.mockReturnValue({
      categories: [],
      isInitializing: false,
      initializationError: null,
      forceCreateDefaults: mockForceCreateDefaults,
      getDefaultTemplates: () => mockTemplates,
      isInitialized: false,
    });

    render(<DefaultCategorySetup />);

    // Open dialog
    const detailsButton = screen.getByText('詳細を確認');
    fireEvent.click(detailsButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          'これらのカテゴリは作成後に自由に編集・削除・追加できます。'
        )
      ).toBeInTheDocument();
    });
  });
});
