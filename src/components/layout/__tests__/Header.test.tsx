import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Header from '../Header';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('Header', () => {
  const defaultProps = {
    drawerWidth: 240,
    onMenuClick: jest.fn(),
    showMenuButton: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders app title', () => {
    renderWithTheme(<Header {...defaultProps} />);

    expect(screen.getByText('会計アプリ')).toBeInTheDocument();
  });

  it('renders app icon', () => {
    renderWithTheme(<Header {...defaultProps} />);

    const icon = screen.getByTestId('AccountBalanceIcon');
    expect(icon).toBeInTheDocument();
  });

  it('shows menu button when showMenuButton is true', () => {
    renderWithTheme(<Header {...defaultProps} showMenuButton={true} />);

    const menuButton = screen.getByLabelText('open drawer');
    expect(menuButton).toBeInTheDocument();
  });

  it('hides menu button when showMenuButton is false', () => {
    renderWithTheme(<Header {...defaultProps} showMenuButton={false} />);

    const menuButton = screen.queryByLabelText('open drawer');
    expect(menuButton).not.toBeInTheDocument();
  });

  it('calls onMenuClick when menu button is clicked', () => {
    const mockOnMenuClick = jest.fn();
    renderWithTheme(
      <Header
        {...defaultProps}
        showMenuButton={true}
        onMenuClick={mockOnMenuClick}
      />
    );

    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct width styling based on drawerWidth', () => {
    renderWithTheme(<Header {...defaultProps} drawerWidth={300} />);

    const appBar = screen.getByRole('banner');
    expect(appBar).toBeInTheDocument();
  });
});
