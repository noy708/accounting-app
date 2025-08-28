import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import Dashboard from '../Dashboard';

// Mock the API hooks to avoid complex setup
jest.mock('../../../store/api/transactionApi', () => ({
  useGetTransactionsQuery: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
  useGetTransactionStatsQuery: () => ({
    data: {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      count: 0,
    },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../../store/api/reportApi', () => ({
  useGetMonthlyReportQuery: () => ({
    data: {
      year: 2024,
      month: 1,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      categoryBreakdown: [],
      transactionCount: 0,
    },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../../../store/api/categoryApi', () => ({
  useGetCategoriesQuery: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

const theme = createTheme();

const createMockStore = () => {
  return configureStore({
    reducer: {
      test: (state = {}) => state,
    },
  });
};

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

describe('Dashboard Component', () => {
  it('ダッシュボードのタイトルが表示される', () => {
    renderDashboard();
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
  });

  it('主要指標のセクションが表示される', () => {
    renderDashboard();
    expect(screen.getByText('今月の収入')).toBeInTheDocument();
    expect(screen.getByText('今月の支出')).toBeInTheDocument();
    expect(screen.getByText('今月の収支')).toBeInTheDocument();
  });

  it('クイックアクションセクションが表示される', () => {
    renderDashboard();
    expect(screen.getByText('クイックアクション')).toBeInTheDocument();
    expect(screen.getByText('収入を追加')).toBeInTheDocument();
    expect(screen.getByText('支出を追加')).toBeInTheDocument();
    expect(screen.getByText('取引一覧')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ管理')).toBeInTheDocument();
    expect(screen.getByText('レポート表示')).toBeInTheDocument();
  });

  it('最近の取引セクションが表示される', () => {
    renderDashboard();
    expect(screen.getByText('最近の取引')).toBeInTheDocument();
  });

  it('概要情報セクションが表示される', () => {
    renderDashboard();
    expect(screen.getByText('概要情報')).toBeInTheDocument();
    expect(screen.getByText('総取引数')).toBeInTheDocument();
    expect(screen.getByText('総収入')).toBeInTheDocument();
    expect(screen.getByText('総支出')).toBeInTheDocument();
    expect(screen.getByText('純資産')).toBeInTheDocument();
  });

  it('取引がない場合のメッセージが表示される', () => {
    renderDashboard();
    expect(screen.getByText('取引がありません')).toBeInTheDocument();
  });

  it('金額が正しい通貨形式で表示される', () => {
    renderDashboard();
    // ￥0 should be displayed for empty data (Japanese Yen symbol)
    const currencyElements = screen.getAllByText('￥0');
    expect(currencyElements.length).toBeGreaterThan(0);
  });
});
