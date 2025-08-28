import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard from '../Dashboard';

// Mock the APIs
const mockTransactions = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    amount: 50000,
    description: '給与',
    categoryId: 'cat1',
    type: 'income' as const,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    date: new Date('2024-01-14'),
    amount: -3000,
    description: '昼食',
    categoryId: 'cat2',
    type: 'expense' as const,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    date: new Date('2024-01-13'),
    amount: -15000,
    description: '食材',
    categoryId: 'cat3',
    type: 'expense' as const,
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
];

const mockCategories = [
  {
    id: 'cat1',
    name: '給与',
    color: '#4caf50',
    type: 'income' as const,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat2',
    name: '食費',
    color: '#f44336',
    type: 'expense' as const,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat3',
    name: '日用品',
    color: '#ff9800',
    type: 'expense' as const,
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockMonthlyReport = {
  year: 2024,
  month: 1,
  totalIncome: 50000,
  totalExpense: -18000,
  balance: 32000,
  categoryBreakdown: [
    {
      categoryId: 'cat1',
      categoryName: '給与',
      amount: 50000,
      percentage: 100,
      transactionCount: 1,
    },
    {
      categoryId: 'cat2',
      categoryName: '食費',
      amount: -3000,
      percentage: 16.7,
      transactionCount: 1,
    },
    {
      categoryId: 'cat3',
      categoryName: '日用品',
      amount: -15000,
      percentage: 83.3,
      transactionCount: 1,
    },
  ],
  transactionCount: 3,
};

const mockOverallStats = {
  totalIncome: 50000,
  totalExpense: -18000,
  balance: 32000,
  count: 3,
};

// Create mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      // Empty reducer for testing
      test: (state = {}) => state,
    },
  });
};

// Mock the API hooks
jest.mock('../../../store/api/transactionApi', () => ({
  useGetTransactionsQuery: () => ({
    data: mockTransactions,
    isLoading: false,
    error: null,
  }),
  useGetTransactionStatsQuery: () => ({
    data: mockOverallStats,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../../store/api/reportApi', () => ({
  useGetMonthlyReportQuery: () => ({
    data: mockMonthlyReport,
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../../store/api/categoryApi', () => ({
  useGetCategoriesQuery: () => ({
    data: mockCategories,
    isLoading: false,
    error: null,
  }),
}));

const theme = createTheme();

const renderDashboard = () => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Dashboard />
      </ThemeProvider>
    </Provider>
  );
};

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ダッシュボードのタイトルが表示される', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    });
  });

  it('主要指標カードが表示される', async () => {
    renderDashboard();

    await waitFor(() => {
      // 今月の収入
      expect(screen.getByText('今月の収入')).toBeInTheDocument();
      expect(screen.getByText('¥50,000')).toBeInTheDocument();

      // 今月の支出
      expect(screen.getByText('今月の支出')).toBeInTheDocument();
      expect(screen.getByText('¥18,000')).toBeInTheDocument();

      // 今月の収支
      expect(screen.getByText('今月の収支')).toBeInTheDocument();
      expect(screen.getByText('¥32,000')).toBeInTheDocument();
    });
  });

  it('クイックアクションボタンが表示される', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('クイックアクション')).toBeInTheDocument();
      expect(screen.getByText('収入を追加')).toBeInTheDocument();
      expect(screen.getByText('支出を追加')).toBeInTheDocument();
      expect(screen.getByText('取引一覧')).toBeInTheDocument();
      expect(screen.getByText('カテゴリ管理')).toBeInTheDocument();
      expect(screen.getByText('レポート表示')).toBeInTheDocument();
    });
  });

  it('最近の取引が表示される', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('最近の取引')).toBeInTheDocument();
      expect(screen.getByText('給与')).toBeInTheDocument();
      expect(screen.getByText('昼食')).toBeInTheDocument();
      expect(screen.getByText('食材')).toBeInTheDocument();
    });
  });

  it('概要情報が表示される', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('概要情報')).toBeInTheDocument();
      expect(screen.getByText('総取引数')).toBeInTheDocument();
      expect(screen.getByText('総収入')).toBeInTheDocument();
      expect(screen.getByText('総支出')).toBeInTheDocument();
      expect(screen.getByText('純資産')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // 総取引数
    });
  });

  it('取引がない場合のメッセージが表示される', async () => {
    // Mock empty transactions
    jest.doMock('../../../store/api/transactionApi', () => ({
      useGetTransactionsQuery: () => ({
        data: [],
        isLoading: false,
        error: null,
      }),
      useGetTransactionStatsQuery: () => ({
        data: { totalIncome: 0, totalExpense: 0, balance: 0, count: 0 },
        isLoading: false,
        error: null,
      }),
    }));

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('取引がありません')).toBeInTheDocument();
    });
  });

  it('ローディング状態が表示される', async () => {
    // Mock loading state
    jest.doMock('../../../store/api/transactionApi', () => ({
      useGetTransactionsQuery: () => ({
        data: undefined,
        isLoading: true,
        error: null,
      }),
      useGetTransactionStatsQuery: () => ({
        data: undefined,
        isLoading: true,
        error: null,
      }),
    }));

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      </Provider>
    );

    expect(
      screen.getByText('ダッシュボードを読み込み中...')
    ).toBeInTheDocument();
  });

  it('エラー状態が表示される', async () => {
    // Mock error state
    jest.doMock('../../../store/api/transactionApi', () => ({
      useGetTransactionsQuery: () => ({
        data: undefined,
        isLoading: false,
        error: { message: 'Network error' },
      }),
      useGetTransactionStatsQuery: () => ({
        data: undefined,
        isLoading: false,
        error: null,
      }),
    }));

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      </Provider>
    );

    expect(
      screen.getByText('ダッシュボードの読み込みに失敗しました')
    ).toBeInTheDocument();
  });

  it('金額が正しい色で表示される', async () => {
    renderDashboard();

    await waitFor(() => {
      // 収入は緑色（success.main）
      const incomeAmount = screen.getByText('¥50,000');
      expect(incomeAmount).toHaveStyle({ color: 'rgb(46, 125, 50)' }); // success.main color

      // 支出は赤色（error.main）
      const expenseAmount = screen.getByText('¥18,000');
      expect(expenseAmount).toHaveStyle({ color: 'rgb(211, 47, 47)' }); // error.main color
    });
  });

  it('カテゴリチップが正しい色で表示される', async () => {
    renderDashboard();

    await waitFor(() => {
      const categoryChips = screen.getAllByText('給与');
      expect(categoryChips[0]).toBeInTheDocument();

      const foodCategoryChip = screen.getByText('食費');
      expect(foodCategoryChip).toBeInTheDocument();
    });
  });

  it('日付が正しい形式で表示される', async () => {
    renderDashboard();

    await waitFor(() => {
      // MM/dd format
      expect(screen.getByText('01/15')).toBeInTheDocument();
      expect(screen.getByText('01/14')).toBeInTheDocument();
      expect(screen.getByText('01/13')).toBeInTheDocument();
    });
  });

  it('取引数の表示が正しい', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('3件の取引')).toBeInTheDocument();
    });
  });

  it('最近の取引が最大5件まで表示される', async () => {
    // Create mock with more than 5 transactions
    const manyTransactions = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      date: new Date(`2024-01-${15 - i}`),
      amount: i % 2 === 0 ? 1000 : -1000,
      description: `取引${i + 1}`,
      categoryId: 'cat1',
      type: (i % 2 === 0 ? 'income' : 'expense') as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    jest.doMock('../../../store/api/transactionApi', () => ({
      useGetTransactionsQuery: () => ({
        data: manyTransactions,
        isLoading: false,
        error: null,
      }),
      useGetTransactionStatsQuery: () => ({
        data: mockOverallStats,
        isLoading: false,
        error: null,
      }),
    }));

    const store = createMockStore();
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <Dashboard />
        </ThemeProvider>
      </Provider>
    );

    await waitFor(() => {
      // Should only show first 5 transactions
      expect(screen.getByText('取引1')).toBeInTheDocument();
      expect(screen.getByText('取引2')).toBeInTheDocument();
      expect(screen.getByText('取引3')).toBeInTheDocument();
      expect(screen.getByText('取引4')).toBeInTheDocument();
      expect(screen.getByText('取引5')).toBeInTheDocument();
      expect(screen.queryByText('取引6')).not.toBeInTheDocument();
    });
  });
});
