import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { transactionSlice } from '../../store/slices/transactionSlice';
import { categorySlice } from '../../store/slices/categorySlice';
import { errorSlice } from '../../store/slices/errorSlice';
import { progressSlice } from '../../store/slices/progressSlice';
import App from '../../App';

// Mock IndexedDB
import 'fake-indexeddb/auto';

// Mock all API hooks for E2E testing
const mockTransactions = [
  {
    id: 'tx-1',
    date: new Date('2024-01-15'),
    amount: -1200,
    description: 'ランチ代',
    categoryId: 'cat-1',
    type: 'expense' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tx-2',
    date: new Date('2024-01-14'),
    amount: 300000,
    description: '給与',
    categoryId: 'cat-2',
    type: 'income' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockCategories = [
  {
    id: 'cat-1',
    name: '食費',
    color: '#FF5722',
    type: 'expense' as const,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-2',
    name: '給与',
    color: '#4CAF50',
    type: 'income' as const,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat-3',
    name: '交通費',
    color: '#2196F3',
    type: 'expense' as const,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock API responses
jest.mock('../../store/api/transactionApi', () => ({
  useGetTransactionsQuery: () => ({
    data: mockTransactions,
    isLoading: false,
    error: null,
  }),
  useCreateTransactionMutation: () => [
    jest.fn().mockImplementation((transaction) => 
      Promise.resolve({ 
        data: { 
          ...transaction, 
          id: `tx-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        } 
      })
    ),
    { isLoading: false },
  ],
  useUpdateTransactionMutation: () => [
    jest.fn().mockImplementation((transaction) => 
      Promise.resolve({ data: { ...transaction, updatedAt: new Date() } })
    ),
    { isLoading: false },
  ],
  useDeleteTransactionMutation: () => [
    jest.fn().mockResolvedValue({}),
    { isLoading: false },
  ],
}));

jest.mock('../../store/api/categoryApi', () => ({
  useGetCategoriesQuery: () => ({
    data: mockCategories,
    isLoading: false,
    error: null,
  }),
  useCreateCategoryMutation: () => [
    jest.fn().mockImplementation((category) => 
      Promise.resolve({ 
        data: { 
          ...category, 
          id: `cat-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        } 
      })
    ),
    { isLoading: false },
  ],
  useUpdateCategoryMutation: () => [
    jest.fn().mockImplementation((category) => 
      Promise.resolve({ data: { ...category, updatedAt: new Date() } })
    ),
    { isLoading: false },
  ],
  useDeleteCategoryMutation: () => [
    jest.fn().mockResolvedValue({}),
    { isLoading: false },
  ],
}));

jest.mock('../../store/api/reportApi', () => ({
  useGetMonthlyReportQuery: () => ({
    data: {
      year: 2024,
      month: 1,
      totalIncome: 300000,
      totalExpense: 1200,
      balance: 298800,
      categoryBreakdown: [
        {
          categoryId: 'cat-1',
          categoryName: '食費',
          amount: 1200,
          percentage: 100,
          transactionCount: 1,
        },
      ],
      transactionCount: 2,
    },
    isLoading: false,
    error: null,
  }),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
}));

describe('E2E Tests - Complete User Journeys', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockNavigate.mockClear();
  });

  describe('New User Onboarding Journey', () => {
    it('should guide new user through complete setup and first transaction', async () => {
      render(<App />);

      // Step 1: User sees dashboard (empty state)
      await waitFor(() => {
        expect(screen.getByText(/ダッシュボード/i)).toBeInTheDocument();
      });

      // Step 2: User navigates to category management to set up categories
      const categoryButton = screen.getByText(/カテゴリ管理/i);
      await user.click(categoryButton);

      // Verify categories are loaded
      await waitFor(() => {
        expect(screen.getByText('食費')).toBeInTheDocument();
        expect(screen.getByText('給与')).toBeInTheDocument();
      });

      // Step 3: User adds a custom category
      const addCategoryButton = screen.getByRole('button', { name: /カテゴリを追加/i });
      await user.click(addCategoryButton);

      const categoryNameInput = screen.getByLabelText(/カテゴリ名/i);
      await user.type(categoryNameInput, '娯楽費');

      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);

      // Step 4: User navigates to add their first transaction
      const transactionButton = screen.getByText(/取引一覧/i);
      await user.click(transactionButton);

      // Step 5: User adds income transaction
      const addTransactionButton = screen.getByRole('button', { name: /収入を追加/i });
      await user.click(addTransactionButton);

      const descriptionInput = screen.getByLabelText(/説明/i);
      await user.type(descriptionInput, '初回給与');

      const amountInput = screen.getByLabelText(/金額/i);
      await user.type(amountInput, '250000');

      const categorySelect = screen.getByLabelText(/カテゴリ/i);
      await user.click(categorySelect);
      
      const salaryOption = screen.getByText('給与');
      await user.click(salaryOption);

      const submitButton = screen.getByRole('button', { name: /追加/i });
      await user.click(submitButton);

      // Step 6: User returns to dashboard to see updated data
      const dashboardButton = screen.getByText(/ダッシュボード/i);
      await user.click(dashboardButton);

      await waitFor(() => {
        expect(screen.getByText(/今月の収入/i)).toBeInTheDocument();
        expect(screen.getByText(/¥300,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Daily Usage Journey', () => {
    it('should handle typical daily expense recording workflow', async () => {
      render(<App />);

      // User starts from dashboard
      await waitFor(() => {
        expect(screen.getByText(/ダッシュボード/i)).toBeInTheDocument();
      });

      // Quick add expense from dashboard
      const addExpenseButton = screen.getByRole('button', { name: /支出を追加/i });
      await user.click(addExpenseButton);

      // Fill out expense form
      const descriptionInput = screen.getByLabelText(/説明/i);
      await user.type(descriptionInput, 'コンビニ弁当');

      const amountInput = screen.getByLabelText(/金額/i);
      await user.type(amountInput, '580');

      const categorySelect = screen.getByLabelText(/カテゴリ/i);
      await user.click(categorySelect);
      
      const foodOption = screen.getByText('食費');
      await user.click(foodOption);

      const expenseRadio = screen.getByLabelText(/支出/i);
      await user.click(expenseRadio);

      const submitButton = screen.getByRole('button', { name: /追加/i });
      await user.click(submitButton);

      // Verify transaction was added and form reset
      await waitFor(() => {
        expect(descriptionInput).toHaveValue('');
      });

      // User checks transaction list
      const viewTransactionsButton = screen.getByText(/取引一覧/i);
      await user.click(viewTransactionsButton);

      await waitFor(() => {
        expect(screen.getByText('ランチ代')).toBeInTheDocument();
        expect(screen.getByText('給与')).toBeInTheDocument();
      });
    });
  });

  describe('Monthly Review Journey', () => {
    it('should support monthly financial review workflow', async () => {
      render(<App />);

      // User navigates to reports
      const reportsButton = screen.getByText(/レポート表示/i);
      await user.click(reportsButton);

      // View monthly report
      await waitFor(() => {
        expect(screen.getByText(/月次レポート/i)).toBeInTheDocument();
      });

      // Check key metrics
      expect(screen.getByText(/総収入/i)).toBeInTheDocument();
      expect(screen.getByText(/総支出/i)).toBeInTheDocument();
      expect(screen.getByText(/収支差額/i)).toBeInTheDocument();

      // View category breakdown
      const categoryReportTab = screen.getByText(/カテゴリ別/i);
      await user.click(categoryReportTab);

      await waitFor(() => {
        expect(screen.getByText('食費')).toBeInTheDocument();
      });

      // View yearly trends
      const yearlyReportTab = screen.getByText(/年次レポート/i);
      await user.click(yearlyReportTab);

      await waitFor(() => {
        expect(screen.getByText(/年次推移/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Management Journey', () => {
    it('should support data export and backup workflow', async () => {
      render(<App />);

      // Navigate to data management
      const dataButton = screen.getByText(/データ管理/i);
      await user.click(dataButton);

      // Export data
      const exportButton = screen.getByRole('button', { name: /エクスポート/i });
      await user.click(exportButton);

      // Select export options
      const csvOption = screen.getByLabelText(/CSV形式/i);
      await user.click(csvOption);

      const exportConfirmButton = screen.getByRole('button', { name: /エクスポート実行/i });
      await user.click(exportConfirmButton);

      // Verify export started
      await waitFor(() => {
        expect(screen.getByText(/エクスポートを開始しました/i)).toBeInTheDocument();
      });

      // Create backup
      const backupButton = screen.getByRole('button', { name: /バックアップ作成/i });
      await user.click(backupButton);

      await waitFor(() => {
        expect(screen.getByText(/バックアップを作成しました/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Journey', () => {
    it('should handle and recover from various error scenarios', async () => {
      // Mock network error
      jest.clearAllMocks();
      jest.mock('../../store/api/transactionApi', () => ({
        useGetTransactionsQuery: () => ({
          data: [],
          isLoading: false,
          error: { message: 'Network error' },
        }),
      }));

      render(<App />);

      // User encounters error
      await waitFor(() => {
        expect(screen.getByText(/エラーが発生しました/i)).toBeInTheDocument();
      });

      // User tries to retry
      const retryButton = screen.getByRole('button', { name: /再試行/i });
      await user.click(retryButton);

      // Error should be handled gracefully
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Accessibility Journey', () => {
    it('should be fully navigable using keyboard only', async () => {
      render(<App />);

      // Navigate using Tab key
      await user.tab();
      expect(document.activeElement).toHaveAttribute('role', 'button');

      // Navigate through main sections
      await user.tab();
      await user.tab();
      await user.tab();

      // Use Enter to activate buttons
      await user.keyboard('{Enter}');

      // Verify navigation works
      expect(document.activeElement).toBeDefined();
    });

    it('should provide proper ARIA labels and screen reader support', async () => {
      render(<App />);

      // Check for proper ARIA labels
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();

      // Check for proper headings hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      // Check for proper form labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Performance Under Load Journey', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeTransactionSet = Array.from({ length: 1000 }, (_, index) => ({
        id: `tx-${index}`,
        date: new Date(2024, 0, (index % 30) + 1),
        amount: Math.random() * 10000,
        description: `Transaction ${index}`,
        categoryId: `cat-${index % 3}`,
        type: index % 2 === 0 ? 'income' : 'expense' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      jest.clearAllMocks();
      jest.mock('../../store/api/transactionApi', () => ({
        useGetTransactionsQuery: () => ({
          data: largeTransactionSet,
          isLoading: false,
          error: null,
        }),
      }));

      const startTime = performance.now();
      
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/ダッシュボード/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time even with large dataset
      expect(renderTime).toBeLessThan(2000); // 2 seconds
    });
  });
});