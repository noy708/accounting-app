import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CategoryReport } from '../CategoryReport';
import { CategorySummary } from '../../../types';

// Chart.jsのモック
jest.mock('react-chartjs-2', () => ({
  Pie: ({ data }: any) => (
    <div data-testid="pie-chart">
      Chart with {data?.labels?.length || 0} categories
    </div>
  ),
}));

jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  ArcElement: {},
  Tooltip: {},
  Legend: {},
}));

// useGetCategoryReportQueryのモック
const mockUseGetCategoryReportQuery = jest.fn();
jest.mock('../../../store/api/reportApi', () => ({
  useGetCategoryReportQuery: () => mockUseGetCategoryReportQuery(),
}));

// LoadingDisplayとErrorDisplayのモック
jest.mock('../../common/LoadingDisplay', () => ({
  LoadingDisplay: ({ message }: { message: string }) => <div>{message}</div>,
}));

jest.mock('../../common/ErrorDisplay', () => ({
  ErrorDisplay: ({ message }: { message: string }) => <div>{message}</div>,
}));

// テスト用のモックデータ
const mockCategoryData: CategorySummary[] = [
  {
    categoryId: '1',
    categoryName: '食費',
    amount: 50000,
    percentage: 50.0,
    transactionCount: 15,
  },
  {
    categoryId: '2',
    categoryName: '交通費',
    amount: 30000,
    percentage: 30.0,
    transactionCount: 10,
  },
  {
    categoryId: '3',
    categoryName: '光熱費',
    amount: 20000,
    percentage: 20.0,
    transactionCount: 5,
  },
];

// テスト用のストア作成
const createTestStore = () => {
  return configureStore({
    reducer: {
      api: (state = {}) => state,
    },
  });
};

describe('CategoryReport - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトのモック設定
    mockUseGetCategoryReportQuery.mockReturnValue({
      data: mockCategoryData,
      isLoading: false,
      error: null,
    });
  });

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createTestStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  describe('基本的な表示', () => {
    it('コンポーネントがレンダリングされる', () => {
      renderWithProvider(<CategoryReport />);
      expect(screen.getByText(/カテゴリ別レポート/)).toBeInTheDocument();
    });

    it('カテゴリデータが表示される', () => {
      renderWithProvider(<CategoryReport />);
      expect(screen.getByText('食費')).toBeInTheDocument();
      expect(screen.getByText('交通費')).toBeInTheDocument();
      expect(screen.getByText('光熱費')).toBeInTheDocument();
    });

    it('金額が正しくフォーマットされて表示される', () => {
      renderWithProvider(<CategoryReport />);
      expect(screen.getByText('¥50,000')).toBeInTheDocument();
      expect(screen.getByText('¥30,000')).toBeInTheDocument();
      expect(screen.getByText('¥20,000')).toBeInTheDocument();
    });

    it('割合が表示される', () => {
      renderWithProvider(<CategoryReport />);
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      expect(screen.getByText('30.0%')).toBeInTheDocument();
      expect(screen.getByText('20.0%')).toBeInTheDocument();
    });

    it('取引数が表示される', () => {
      renderWithProvider(<CategoryReport />);
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('円グラフが表示される', () => {
      renderWithProvider(<CategoryReport />);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByText('Chart with 3 categories')).toBeInTheDocument();
    });

    it('総支出が計算されて表示される', () => {
      renderWithProvider(<CategoryReport />);
      expect(screen.getByText('総支出: ¥100,000')).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はLoadingDisplayが表示される', () => {
      mockUseGetCategoryReportQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderWithProvider(<CategoryReport />);
      expect(
        screen.getByText('カテゴリレポートを読み込み中...')
      ).toBeInTheDocument();
    });
  });

  describe('エラー状態', () => {
    it('エラー時はErrorDisplayが表示される', () => {
      mockUseGetCategoryReportQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Network error' },
      });

      renderWithProvider(<CategoryReport />);
      expect(
        screen.getByText('カテゴリレポートの読み込みに失敗しました')
      ).toBeInTheDocument();
    });
  });

  describe('データなし状態', () => {
    it('データがない場合は適切なメッセージが表示される', () => {
      mockUseGetCategoryReportQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderWithProvider(<CategoryReport />);
      expect(
        screen.getByText('選択された期間にデータがありません')
      ).toBeInTheDocument();
    });
  });

  describe('プロパティ', () => {
    it('classNameプロパティが適用される', () => {
      const { container } = renderWithProvider(
        <CategoryReport className="test-class" />
      );
      expect(container.firstChild).toHaveClass('test-class');
    });
  });
});
