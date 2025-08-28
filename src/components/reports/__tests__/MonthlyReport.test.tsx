// Tests for MonthlyReport component
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MonthlyReport as MonthlyReportType } from '../../../types';

// Mock the useGetMonthlyReportQuery hook
jest.mock('../../../store/api/reportApi', () => ({
  useGetMonthlyReportQuery: jest.fn(),
}));

// Mock the MonthSelector component to avoid date-fns issues
jest.mock('../../common/MonthSelector', () => ({
  MonthSelector: ({ year, month }: any) => (
    <div data-testid="month-selector">
      Year: {year}, Month: {month}
    </div>
  ),
}));

// Mock the LoadingDisplay and ErrorDisplay components
jest.mock('../../common/LoadingDisplay', () => ({
  LoadingDisplay: ({ message }: any) => <div>{message}</div>,
}));

jest.mock('../../common/ErrorDisplay', () => ({
  ErrorDisplay: ({ message, onRetry }: any) => (
    <div>
      <div>{message}</div>
      <button onClick={onRetry}>再試行</button>
    </div>
  ),
}));

import { MonthlyReport } from '../MonthlyReport';
import { useGetMonthlyReportQuery } from '../../../store/api/reportApi';

const mockUseGetMonthlyReportQuery =
  useGetMonthlyReportQuery as jest.MockedFunction<
    typeof useGetMonthlyReportQuery
  >;

const mockMonthlyReport: MonthlyReportType = {
  year: 2023,
  month: 6,
  totalIncome: 50000,
  totalExpense: 4500,
  balance: 45500,
  transactionCount: 3,
  categoryBreakdown: [
    {
      categoryId: 'cat1',
      categoryName: '給与',
      amount: 50000,
      percentage: 91.7,
      transactionCount: 1,
    },
    {
      categoryId: 'cat2',
      categoryName: '食費',
      amount: 3000,
      percentage: 5.5,
      transactionCount: 1,
    },
  ],
};

describe('MonthlyReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    mockUseGetMonthlyReportQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      refetch: jest.fn(),
    } as any);

    render(<MonthlyReport />);

    expect(screen.getByText('月次レポートを読み込み中...')).toBeInTheDocument();
  });

  it('should render error state', () => {
    const mockRefetch = jest.fn();
    mockUseGetMonthlyReportQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Network error' },
      refetch: mockRefetch,
    } as any);

    render(<MonthlyReport />);

    expect(
      screen.getByText('月次レポートの読み込みに失敗しました')
    ).toBeInTheDocument();
  });

  it('should render monthly report with data', () => {
    mockUseGetMonthlyReportQuery.mockReturnValue({
      data: mockMonthlyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any);

    render(<MonthlyReport />);

    // Check title
    expect(screen.getByText('月次レポート')).toBeInTheDocument();

    // Check summary cards
    expect(screen.getByText('総収入')).toBeInTheDocument();
    expect(screen.getAllByText('￥50,000')).toHaveLength(2); // Appears in summary and table
    expect(screen.getByText('総支出')).toBeInTheDocument();
    expect(screen.getByText('￥4,500')).toBeInTheDocument();
    expect(screen.getByText('収支差額')).toBeInTheDocument();
    expect(screen.getByText('￥45,500')).toBeInTheDocument();
    expect(screen.getAllByText('取引件数')).toHaveLength(2); // Appears in summary and table header
    expect(screen.getByText('3件')).toBeInTheDocument();

    // Check category breakdown table
    expect(screen.getByText('カテゴリ別内訳')).toBeInTheDocument();
    expect(screen.getByText('給与')).toBeInTheDocument();
    expect(screen.getByText('食費')).toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    const emptyReport: MonthlyReportType = {
      ...mockMonthlyReport,
      categoryBreakdown: [],
      transactionCount: 0,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
    };

    mockUseGetMonthlyReportQuery.mockReturnValue({
      data: emptyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any);

    render(<MonthlyReport />);

    expect(screen.getByText(/年.*月のデータがありません/)).toBeInTheDocument();
  });

  it('should display negative balance correctly', () => {
    const negativeBalanceReport: MonthlyReportType = {
      ...mockMonthlyReport,
      totalIncome: 1000,
      totalExpense: 2000,
      balance: -1000,
    };

    mockUseGetMonthlyReportQuery.mockReturnValue({
      data: negativeBalanceReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any);

    render(<MonthlyReport />);

    expect(screen.getByText('-￥1,000')).toBeInTheDocument();
  });
});
