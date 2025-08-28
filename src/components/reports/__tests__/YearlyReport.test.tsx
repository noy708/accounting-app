// Tests for YearlyReport component
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { YearlyReport } from '../YearlyReport';
import {
  YearlyReport as YearlyReportType,
  MonthlyReport,
} from '../../../types';

// Mock the entire reportApi
jest.mock('../../../store/api/reportApi', () => ({
  useGetYearlyReportQuery: jest.fn(),
}));

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div
      data-testid="line-chart"
      data-chart-data={JSON.stringify(data)}
      data-chart-options={JSON.stringify(options)}
    >
      Line Chart
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div
      data-testid="bar-chart"
      data-chart-data={JSON.stringify(data)}
      data-chart-options={JSON.stringify(options)}
    >
      Bar Chart
    </div>
  ),
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  BarElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
}));

// Mock data
const mockMonthlyData: MonthlyReport[] = Array.from(
  { length: 12 },
  (_, index) => ({
    year: 2024,
    month: index + 1,
    totalIncome: (index + 1) * 100000,
    totalExpense: (index + 1) * 80000,
    balance: (index + 1) * 20000,
    categoryBreakdown: [],
    transactionCount: (index + 1) * 10,
  })
);

const mockYearlyReport: YearlyReportType = {
  year: 2024,
  monthlyData: mockMonthlyData,
  totalIncome: 7800000,
  totalExpense: 6240000,
  balance: 1560000,
};

const { useGetYearlyReportQuery } = require('../../../store/api/reportApi');

const createMockStore = () => {
  return configureStore({
    reducer: {
      // Empty reducer for testing
      test: (state = {}) => state,
    },
  });
};

describe('YearlyReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    useGetYearlyReportQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <YearlyReport />
      </Provider>
    );

    expect(screen.getByText('年次レポートを読み込み中...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    useGetYearlyReportQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Error occurred' },
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <YearlyReport />
      </Provider>
    );

    expect(
      screen.getByText('年次レポートの読み込みに失敗しました')
    ).toBeInTheDocument();
  });

  it('renders yearly report with summary cards', () => {
    useGetYearlyReportQuery.mockReturnValue({
      data: mockYearlyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <YearlyReport />
      </Provider>
    );

    expect(screen.getByText('年次レポート')).toBeInTheDocument();
    expect(screen.getByText('年間総収入')).toBeInTheDocument();
    expect(screen.getByText('年間総支出')).toBeInTheDocument();
    expect(screen.getByText('年間収支差額')).toBeInTheDocument();
    expect(screen.getByText('月平均収支')).toBeInTheDocument();
  });

  it('renders year selector with current year', () => {
    useGetYearlyReportQuery.mockReturnValue({
      data: mockYearlyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const store = createMockStore();
    const currentYear = new Date().getFullYear();

    render(
      <Provider store={store}>
        <YearlyReport />
      </Provider>
    );

    expect(
      screen.getByDisplayValue(currentYear.toString())
    ).toBeInTheDocument();
  });

  it('renders chart tabs', () => {
    useGetYearlyReportQuery.mockReturnValue({
      data: mockYearlyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <YearlyReport />
      </Provider>
    );

    expect(screen.getByText('推移グラフ')).toBeInTheDocument();
    expect(screen.getByText('月別比較')).toBeInTheDocument();
    expect(screen.getByText('月別詳細')).toBeInTheDocument();
  });

  it('displays line chart by default', () => {
    useGetYearlyReportQuery.mockReturnValue({
      data: mockYearlyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <YearlyReport />
      </Provider>
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('switches to bar chart when tab is clicked', () => {
    useGetYearlyReportQuery.mockReturnValue({
      data: mockYearlyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <YearlyReport />
      </Provider>
    );

    const barChartTab = screen.getByText('月別比較');
    fireEvent.click(barChartTab);

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('displays monthly details table when tab is clicked', () => {
    useGetYearlyReportQuery.mockReturnValue({
      data: mockYearlyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <YearlyReport />
      </Provider>
    );

    const detailsTab = screen.getByText('月別詳細');
    fireEvent.click(detailsTab);

    expect(screen.getByText('月')).toBeInTheDocument();
    expect(screen.getByText('収入')).toBeInTheDocument();
    expect(screen.getByText('支出')).toBeInTheDocument();
    expect(screen.getByText('収支差額')).toBeInTheDocument();
    expect(screen.getByText('取引件数')).toBeInTheDocument();

    // Check that all 12 months are displayed
    for (let month = 1; month <= 12; month++) {
      expect(screen.getByText(`${month}月`)).toBeInTheDocument();
    }
  });

  it('displays no data message when all months have zero transactions', () => {
    const emptyMonthlyData = mockMonthlyData.map((month) => ({
      ...month,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0,
    }));

    const emptyYearlyReport: YearlyReportType = {
      ...mockYearlyReport,
      monthlyData: emptyMonthlyData,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
    };

    useGetYearlyReportQuery.mockReturnValue({
      data: emptyYearlyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <YearlyReport />
      </Provider>
    );

    expect(screen.getByText(/のデータがありません/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    useGetYearlyReportQuery.mockReturnValue({
      data: mockYearlyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const store = createMockStore();

    const { container } = render(
      <Provider store={store}>
        <YearlyReport className="custom-class" />
      </Provider>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with data when report is available', () => {
    useGetYearlyReportQuery.mockReturnValue({
      data: mockYearlyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <YearlyReport />
      </Provider>
    );

    // Just check that the component renders without crashing
    expect(screen.getByText('年次レポート')).toBeInTheDocument();
    expect(screen.getByText('年間総収入')).toBeInTheDocument();
  });

  it('prepares chart data correctly', () => {
    useGetYearlyReportQuery.mockReturnValue({
      data: mockYearlyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <YearlyReport />
      </Provider>
    );

    const lineChart = screen.getByTestId('line-chart');
    const chartData = JSON.parse(
      lineChart.getAttribute('data-chart-data') || '{}'
    );

    expect(chartData.labels).toEqual([
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ]);

    expect(chartData.datasets).toHaveLength(3);
    expect(chartData.datasets[0].label).toBe('収入');
    expect(chartData.datasets[1].label).toBe('支出');
    expect(chartData.datasets[2].label).toBe('収支差額');
  });

  it('handles year change', async () => {
    useGetYearlyReportQuery.mockReturnValue({
      data: mockYearlyReport,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    });

    const store = createMockStore();

    render(
      <Provider store={store}>
        <YearlyReport />
      </Provider>
    );

    const yearSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(yearSelect);

    const option2023 = screen.getByRole('option', { name: '2023年' });
    fireEvent.click(option2023);

    await waitFor(() => {
      expect(screen.getByDisplayValue('2023')).toBeInTheDocument();
    });
  });
});
