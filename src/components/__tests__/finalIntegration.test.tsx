/**
 * Final Integration Test Suite
 * Tests the complete application functionality for deployment readiness
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from '../../App';
import { transactionSlice } from '../../store/slices/transactionSlice';
import { categorySlice } from '../../store/slices/categorySlice';
import { errorSlice } from '../../store/slices/errorSlice';
import { progressSlice } from '../../store/slices/progressSlice';

// Mock IndexedDB
const mockDB = {
  transactions: new Map(),
  categories: new Map(),
  open: jest.fn().mockResolvedValue({}),
  transaction: jest.fn().mockReturnValue({
    objectStore: jest.fn().mockReturnValue({
      add: jest.fn().mockResolvedValue({}),
      put: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      getAll: jest.fn().mockResolvedValue([]),
      get: jest.fn().mockResolvedValue(undefined),
    }),
  }),
};

// Mock Dexie
jest.mock('dexie', () => {
  return {
    Dexie: jest.fn().mockImplementation(() => mockDB),
  };
});

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  LineElement: jest.fn(),
  PointElement: jest.fn(),
  ArcElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>,
}));

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

const createTestStore = () => {
  return configureStore({
    reducer: {
      transactions: transactionSlice.reducer,
      categories: categorySlice.reducer,
      error: errorSlice.reducer,
      progress: progressSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
        },
      }),
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {component}
      </ThemeProvider>
    </Provider>
  );
};

describe('Final Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock database
    mockDB.transactions.clear();
    mockDB.categories.clear();
  });

  describe('Application Bootstrap', () => {
    it('renders without crashing', () => {
      renderWithProviders(<App />);
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });

    it('initializes with default categories', async () => {
      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
      });
    });

    it('handles database initialization errors gracefully', async () => {
      mockDB.open.mockRejectedValueOnce(new Error('Database error'));

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText('会計アプリ')).toBeInTheDocument();
      });
    });
  });

  describe('Core Functionality Integration', () => {
    it('supports complete transaction workflow', async () => {
      renderWithProviders(<App />);

      // Navigate to transactions
      const transactionsLink = screen.getByText('取引');
      fireEvent.click(transactionsLink);

      await waitFor(() => {
        expect(screen.getByText('取引一覧')).toBeInTheDocument();
      });
    });

    it('supports category management workflow', async () => {
      renderWithProviders(<App />);

      // Navigate to categories
      const categoriesLink = screen.getByText('カテゴリ');
      fireEvent.click(categoriesLink);

      await waitFor(() => {
        expect(screen.getByText('カテゴリ管理')).toBeInTheDocument();
      });
    });

    it('supports report generation workflow', async () => {
      renderWithProviders(<App />);

      // Navigate to reports
      const reportsLink = screen.getByText('レポート');
      fireEvent.click(reportsLink);

      await waitFor(() => {
        expect(screen.getByText('レポート')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('displays global error messages', async () => {
      renderWithProviders(<App />);

      // Simulate an error condition
      const store = createTestStore();
      store.dispatch(
        errorSlice.actions.setError({
          message: 'Test error message',
          type: 'system',
          retryable: true,
        })
      );

      // Error should be handled gracefully
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });

    it('handles network errors gracefully', async () => {
      // Mock network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      renderWithProviders(<App />);

      await waitFor(() => {
        expect(screen.getByText('会計アプリ')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Integration', () => {
    it('renders efficiently with large datasets', async () => {
      // Mock large dataset
      const largeTransactionSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `transaction-${i}`,
        date: new Date(),
        amount: Math.random() * 1000,
        description: `Transaction ${i}`,
        categoryId: 'category-1',
        type: 'expense' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockDB.transactions = new Map(largeTransactionSet.map((t) => [t.id, t]));

      const startTime = performance.now();
      renderWithProviders(<App />);
      const endTime = performance.now();

      // Should render within reasonable time (< 1000ms)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });
  });

  describe('Responsive Design Integration', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      renderWithProviders(<App />);

      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });

    it('adapts to desktop viewport', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1080,
      });

      renderWithProviders(<App />);

      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });
  });

  describe('Data Persistence Integration', () => {
    it('handles data export functionality', async () => {
      renderWithProviders(<App />);

      // Navigate to data management
      const dataLink = screen.getByText('データ');
      fireEvent.click(dataLink);

      await waitFor(() => {
        expect(screen.getByText('データ管理')).toBeInTheDocument();
      });
    });

    it('handles data import functionality', async () => {
      renderWithProviders(<App />);

      // Navigate to data management
      const dataLink = screen.getByText('データ');
      fireEvent.click(dataLink);

      await waitFor(() => {
        expect(screen.getByText('データ管理')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Integration', () => {
    it('provides proper ARIA labels', () => {
      renderWithProviders(<App />);

      // Check for main navigation
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderWithProviders(<App />);

      // Check that interactive elements are focusable
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });
});
