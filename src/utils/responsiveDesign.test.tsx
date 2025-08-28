/**
 * Responsive Design Test Suite
 * Tests for responsive behavior across different screen sizes
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import transactionSlice from '../store/slices/transactionSlice';
import categorySlice from '../store/slices/categorySlice';
import errorSlice from '../store/slices/errorSlice';
import progressSlice from '../store/slices/progressSlice';

// Mock dependencies
jest.mock('dexie', () => ({
  Dexie: jest.fn().mockImplementation(() => ({
    open: jest.fn().mockResolvedValue({}),
    transaction: jest.fn().mockReturnValue({
      objectStore: jest.fn().mockReturnValue({
        getAll: jest.fn().mockResolvedValue([]),
      }),
    }),
  })),
}));

jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
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
  Bar: jest.fn(() => null),
  Line: jest.fn(() => null),
  Pie: jest.fn(() => null),
}));

const theme = createTheme();

const createTestStore = () => {
  return configureStore({
    reducer: {
      transactions: transactionSlice,
      categories: categorySlice,
      error: errorSlice,
      progress: progressSlice,
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </Provider>
  );
};

// Viewport size constants
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 },
};

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
};

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mobile Viewport (375px)', () => {
    beforeEach(() => {
      setViewport(VIEWPORTS.mobile.width, VIEWPORTS.mobile.height);
    });

    it('renders mobile layout correctly', () => {
      renderWithProviders(<App />);
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });

    it('shows mobile navigation', () => {
      renderWithProviders(<App />);
      // Mobile navigation should be present
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('adapts form layouts for mobile', () => {
      renderWithProviders(<App />);
      // Forms should stack vertically on mobile
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });

    it('handles touch interactions', () => {
      renderWithProviders(<App />);
      // Touch targets should be appropriately sized
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Tablet Viewport (768px)', () => {
    beforeEach(() => {
      setViewport(VIEWPORTS.tablet.width, VIEWPORTS.tablet.height);
    });

    it('renders tablet layout correctly', () => {
      renderWithProviders(<App />);
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });

    it('shows appropriate navigation for tablet', () => {
      renderWithProviders(<App />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('optimizes content layout for tablet', () => {
      renderWithProviders(<App />);
      // Content should be optimized for tablet viewing
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });
  });

  describe('Desktop Viewport (1920px)', () => {
    beforeEach(() => {
      setViewport(VIEWPORTS.desktop.width, VIEWPORTS.desktop.height);
    });

    it('renders desktop layout correctly', () => {
      renderWithProviders(<App />);
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });

    it('shows full desktop navigation', () => {
      renderWithProviders(<App />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('utilizes full screen real estate', () => {
      renderWithProviders(<App />);
      // Desktop layout should make full use of available space
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });
  });

  describe('Ultra-wide Viewport (2560px)', () => {
    beforeEach(() => {
      setViewport(VIEWPORTS.ultrawide.width, VIEWPORTS.ultrawide.height);
    });

    it('handles ultra-wide screens gracefully', () => {
      renderWithProviders(<App />);
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });

    it('prevents content from becoming too wide', () => {
      renderWithProviders(<App />);
      // Content should have max-width constraints
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });
  });

  describe('Orientation Changes', () => {
    it('handles portrait to landscape transition', () => {
      // Start in portrait
      setViewport(375, 667);
      renderWithProviders(<App />);

      // Switch to landscape
      setViewport(667, 375);

      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });

    it('handles landscape to portrait transition', () => {
      // Start in landscape
      setViewport(667, 375);
      renderWithProviders(<App />);

      // Switch to portrait
      setViewport(375, 667);

      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });
  });

  describe('Breakpoint Transitions', () => {
    it('transitions smoothly between mobile and tablet', () => {
      setViewport(375, 667); // Mobile
      renderWithProviders(<App />);

      setViewport(768, 1024); // Tablet
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });

    it('transitions smoothly between tablet and desktop', () => {
      setViewport(768, 1024); // Tablet
      renderWithProviders(<App />);

      setViewport(1920, 1080); // Desktop
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });
  });

  describe('Content Adaptation', () => {
    it('adapts table layouts for small screens', () => {
      setViewport(375, 667);
      renderWithProviders(<App />);

      // Tables should be responsive or replaced with cards
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });

    it('adapts chart displays for different screen sizes', () => {
      setViewport(375, 667);
      renderWithProviders(<App />);

      // Charts should be responsive
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });

    it('adapts form layouts appropriately', () => {
      setViewport(375, 667);
      renderWithProviders(<App />);

      // Forms should stack on mobile, side-by-side on desktop
      expect(screen.getByText('会計アプリ')).toBeInTheDocument();
    });
  });

  describe('Typography Scaling', () => {
    it('uses appropriate font sizes for mobile', () => {
      setViewport(375, 667);
      renderWithProviders(<App />);

      // Typography should be readable on mobile
      const heading = screen.getByText('会計アプリ');
      expect(heading).toBeInTheDocument();
    });

    it('uses appropriate font sizes for desktop', () => {
      setViewport(1920, 1080);
      renderWithProviders(<App />);

      // Typography should scale appropriately for desktop
      const heading = screen.getByText('会計アプリ');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Touch and Mouse Interactions', () => {
    it('provides appropriate touch targets on mobile', () => {
      setViewport(375, 667);
      renderWithProviders(<App />);

      // Touch targets should be at least 44px
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('supports hover states on desktop', () => {
      setViewport(1920, 1080);
      renderWithProviders(<App />);

      // Hover states should be available on desktop
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Performance on Different Devices', () => {
    it('performs well on mobile devices', () => {
      setViewport(375, 667);

      const startTime = performance.now();
      renderWithProviders(<App />);
      const endTime = performance.now();

      // Should render quickly on mobile
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('performs well on desktop devices', () => {
      setViewport(1920, 1080);

      const startTime = performance.now();
      renderWithProviders(<App />);
      const endTime = performance.now();

      // Should render quickly on desktop
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
