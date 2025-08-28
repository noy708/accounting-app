import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LoadingDisplay from '../LoadingDisplay';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('LoadingDisplay', () => {
  it('renders circular loader by default', () => {
    renderWithTheme(<LoadingDisplay loading={true} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders with loading message', () => {
    renderWithTheme(<LoadingDisplay loading={true} message="読み込み中..." />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('renders linear progress bar', () => {
    renderWithTheme(<LoadingDisplay loading={true} type="linear" />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders skeleton loader', () => {
    renderWithTheme(
      <LoadingDisplay loading={true} type="skeleton" skeletonLines={3} />
    );

    // Should render skeleton elements
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBe(3);
  });

  it('renders inline loader', () => {
    renderWithTheme(
      <LoadingDisplay loading={true} type="inline" message="処理中" />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('処理中')).toBeInTheDocument();
  });

  it('shows progress percentage for determinate progress', () => {
    renderWithTheme(<LoadingDisplay loading={true} progress={75} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders children when not loading', () => {
    renderWithTheme(
      <LoadingDisplay loading={false}>
        <div>Content loaded</div>
      </LoadingDisplay>
    );

    expect(screen.getByText('Content loaded')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders backdrop loader', () => {
    renderWithTheme(
      <LoadingDisplay loading={true} type="backdrop" message="処理中..." />
    );

    expect(screen.getByText('処理中...')).toBeInTheDocument();
    // Backdrop should be present
    expect(document.querySelector('.MuiBackdrop-root')).toBeInTheDocument();
  });

  it('renders overlay loader with children', () => {
    renderWithTheme(
      <LoadingDisplay loading={true} overlay={true}>
        <div>Background content</div>
      </LoadingDisplay>
    );

    expect(screen.getByText('Background content')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('uses different sizes correctly', () => {
    const { rerender } = renderWithTheme(
      <LoadingDisplay loading={true} size="small" />
    );

    let progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <LoadingDisplay loading={true} size="large" />
      </ThemeProvider>
    );

    progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
  });

  it('handles linear progress with message and percentage', () => {
    renderWithTheme(
      <LoadingDisplay
        loading={true}
        type="linear"
        message="アップロード中..."
        progress={50}
      />
    );

    expect(screen.getByText('アップロード中...')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
