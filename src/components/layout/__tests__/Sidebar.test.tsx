import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Sidebar from '../Sidebar';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

// Mock console.log to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('Sidebar', () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it('renders all navigation items', () => {
    renderWithTheme(<Sidebar />);

    // Main navigation items
    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
    expect(screen.getByText('取引を追加')).toBeInTheDocument();
    expect(screen.getByText('取引一覧')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ管理')).toBeInTheDocument();
    expect(screen.getByText('月次レポート')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ別レポート')).toBeInTheDocument();
    expect(screen.getByText('年次レポート')).toBeInTheDocument();
    expect(screen.getByText('データエクスポート')).toBeInTheDocument();
    expect(screen.getByText('データインポート')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
  });

  it('renders section headers', () => {
    renderWithTheme(<Sidebar />);

    expect(screen.getByText('取引管理')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ')).toBeInTheDocument();
    expect(screen.getByText('レポート')).toBeInTheDocument();
    expect(screen.getByText('データ管理')).toBeInTheDocument();
    expect(screen.getByText('その他')).toBeInTheDocument();
  });

  it('renders app version in footer', () => {
    renderWithTheme(<Sidebar />);

    expect(screen.getByText('会計アプリ v1.0')).toBeInTheDocument();
  });

  it('calls onItemClick when navigation item is clicked', () => {
    const mockOnItemClick = jest.fn();
    renderWithTheme(<Sidebar onItemClick={mockOnItemClick} />);

    const dashboardItem = screen.getByText('ダッシュボード');
    fireEvent.click(dashboardItem);

    expect(mockOnItemClick).toHaveBeenCalledTimes(1);
  });

  it('logs navigation path when item is clicked', () => {
    renderWithTheme(<Sidebar />);

    const dashboardItem = screen.getByText('ダッシュボード');
    fireEvent.click(dashboardItem);

    expect(mockConsoleLog).toHaveBeenCalledWith('Navigate to: /');
  });

  it('renders icons for navigation items', () => {
    renderWithTheme(<Sidebar />);

    // Check for some key icons
    expect(screen.getByTestId('DashboardIcon')).toBeInTheDocument();
    expect(screen.getByTestId('AddIcon')).toBeInTheDocument();
    expect(screen.getByTestId('ListIcon')).toBeInTheDocument();
    expect(screen.getByTestId('CategoryIcon')).toBeInTheDocument();
  });

  it('handles item click without onItemClick prop', () => {
    renderWithTheme(<Sidebar />);

    const dashboardItem = screen.getByText('ダッシュボード');

    // Should not throw error
    expect(() => fireEvent.click(dashboardItem)).not.toThrow();
    expect(mockConsoleLog).toHaveBeenCalledWith('Navigate to: /');
  });
});
