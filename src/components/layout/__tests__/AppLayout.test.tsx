import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AppLayout from '../AppLayout';

const theme = createTheme();

// Mock useMediaQuery
jest.mock('@mui/material/useMediaQuery', () => jest.fn());

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('AppLayout', () => {
  const mockChildren = <div data-testid="test-content">Test Content</div>;
  const mockUseMediaQuery = require('@mui/material/useMediaQuery');

  beforeEach(() => {
    // Default to desktop view
    mockUseMediaQuery.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders children content', () => {
    renderWithTheme(<AppLayout>{mockChildren}</AppLayout>);

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders header with app title', () => {
    renderWithTheme(<AppLayout>{mockChildren}</AppLayout>);

    expect(screen.getByText('会計アプリ')).toBeInTheDocument();
  });

  it('renders sidebar navigation items', () => {
    renderWithTheme(<AppLayout>{mockChildren}</AppLayout>);

    // Use getAllByText for items that might appear multiple times (permanent + temporary drawers)
    expect(screen.getAllByText('ダッシュボード')[0]).toBeInTheDocument();
    expect(screen.getAllByText('取引を追加')[0]).toBeInTheDocument();
    expect(screen.getAllByText('取引一覧')[0]).toBeInTheDocument();
    expect(screen.getAllByText('カテゴリ管理')[0]).toBeInTheDocument();
  });

  it('shows mobile menu button on small screens', () => {
    // Mock useMediaQuery to return true (mobile)
    mockUseMediaQuery.mockReturnValue(true);

    renderWithTheme(<AppLayout>{mockChildren}</AppLayout>);

    // Menu button should be visible
    const menuButton = screen.getByLabelText('open drawer');
    expect(menuButton).toBeInTheDocument();
  });

  it('hides mobile menu button on large screens', () => {
    // Mock useMediaQuery to return false (desktop)
    mockUseMediaQuery.mockReturnValue(false);

    renderWithTheme(<AppLayout>{mockChildren}</AppLayout>);

    // Menu button should not be visible
    const menuButton = screen.queryByLabelText('open drawer');
    expect(menuButton).not.toBeInTheDocument();
  });

  it('toggles mobile drawer when menu button is clicked', () => {
    // Mock useMediaQuery to return true (mobile)
    mockUseMediaQuery.mockReturnValue(true);

    renderWithTheme(<AppLayout>{mockChildren}</AppLayout>);

    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    // Check if drawer is opened (temporary drawer should be visible)
    // In mobile view, both permanent (hidden) and temporary drawers exist
    expect(screen.getAllByText('ダッシュボード')).toHaveLength(2);
  });

  it('applies correct styling for main content area', () => {
    renderWithTheme(<AppLayout>{mockChildren}</AppLayout>);

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveStyle({
      'flex-grow': '1',
    });
  });
});
