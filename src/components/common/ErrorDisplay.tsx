import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { ErrorState } from '../../types';

interface ErrorDisplayProps {
  error: ErrorState;
  onClose?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
  variant?: 'standard' | 'filled' | 'outlined';
  size?: 'small' | 'medium';
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onClose,
  onRetry,
  showDetails = false,
  variant = 'standard',
  size = 'medium',
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const getSeverity = (errorType: ErrorState['type']) => {
    switch (errorType) {
      case 'validation':
        return 'warning';
      case 'business':
        return 'info';
      case 'database':
      case 'system':
        return 'error';
      default:
        return 'error';
    }
  };

  const getTitle = (errorType: ErrorState['type']) => {
    switch (errorType) {
      case 'validation':
        return '入力エラー';
      case 'business':
        return '業務エラー';
      case 'database':
        return 'データベースエラー';
      case 'system':
        return 'システムエラー';
      default:
        return 'エラー';
    }
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Alert
      severity={getSeverity(error.type)}
      variant={variant}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {error.retryable && onRetry && (
            <Button
              color="inherit"
              size="small"
              onClick={onRetry}
              startIcon={<RefreshIcon />}
            >
              再試行
            </Button>
          )}
          {showDetails && (
            <IconButton
              color="inherit"
              size="small"
              onClick={handleToggleExpanded}
              aria-label={expanded ? '詳細を閉じる' : '詳細を表示'}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
          {onClose && (
            <IconButton
              color="inherit"
              size="small"
              onClick={onClose}
              aria-label="閉じる"
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      }
      sx={{
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      <AlertTitle>{getTitle(error.type)}</AlertTitle>
      <Typography variant={size === 'small' ? 'body2' : 'body1'}>
        {error.message}
      </Typography>

      {showDetails && (
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" component="div" gutterBottom>
              <strong>エラー詳細:</strong>
            </Typography>
            <Typography variant="caption" component="div" sx={{ mb: 1 }}>
              <strong>タイプ:</strong> {error.type}
            </Typography>
            <Typography variant="caption" component="div" sx={{ mb: 1 }}>
              <strong>再試行可能:</strong> {error.retryable ? 'はい' : 'いいえ'}
            </Typography>
            {error.field && (
              <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                <strong>フィールド:</strong> {error.field}
              </Typography>
            )}
            <Typography
              variant="caption"
              component="div"
              sx={{ fontFamily: 'monospace' }}
            >
              <strong>メッセージ:</strong> {error.message}
            </Typography>
          </Box>
        </Collapse>
      )}
    </Alert>
  );
};

export default ErrorDisplay;
