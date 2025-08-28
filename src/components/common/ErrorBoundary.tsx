import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In a real app, you might want to log this to an error reporting service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // This would typically send to an error reporting service like Sentry
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
    };

    console.error('Error Report:', errorReport);

    // Store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(
        localStorage.getItem('errorReports') || '[]'
      );
      existingErrors.push(errorReport);
      // Keep only last 10 errors
      const recentErrors = existingErrors.slice(-10);
      localStorage.setItem('errorReports', JSON.stringify(recentErrors));
    } catch (e) {
      console.error('Failed to store error report:', e);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private copyErrorToClipboard = () => {
    const errorText = `
Error ID: ${this.state.errorId}
Message: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard
      .writeText(errorText)
      .then(() => {
        alert('エラー情報をクリップボードにコピーしました');
      })
      .catch(() => {
        console.error('Failed to copy error to clipboard');
      });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
          p={3}
        >
          <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%' }}>
            <Stack spacing={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <BugReportIcon color="error" fontSize="large" />
                <Typography variant="h5" color="error">
                  予期しないエラーが発生しました
                </Typography>
              </Box>

              <Alert severity="error">
                <AlertTitle>エラーが発生しました</AlertTitle>
                アプリケーションで予期しないエラーが発生しました。
                ページを再読み込みするか、しばらく待ってから再試行してください。
              </Alert>

              <Box display="flex" gap={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                >
                  再試行
                </Button>
                <Button variant="outlined" onClick={this.handleReload}>
                  ページを再読み込み
                </Button>
              </Box>

              {process.env.NODE_ENV === 'development' && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>エラー詳細 (開発者向け)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          エラーID:
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {this.state.errorId}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          エラーメッセージ:
                        </Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {this.state.error?.message}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          スタックトレース:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            backgroundColor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                            maxHeight: 200,
                            overflow: 'auto',
                          }}
                        >
                          {this.state.error?.stack}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          コンポーネントスタック:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            backgroundColor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                            maxHeight: 200,
                            overflow: 'auto',
                          }}
                        >
                          {this.state.errorInfo?.componentStack}
                        </Typography>
                      </Box>

                      <Button
                        variant="outlined"
                        size="small"
                        onClick={this.copyErrorToClipboard}
                      >
                        エラー情報をコピー
                      </Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
