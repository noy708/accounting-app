import React, { useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  Grow,
  Fade,
  IconButton,
  Box,
  Typography,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { addNotification, removeNotification } from '../../store/slices/errorSlice';
import { selectActiveOperations } from '../../store/selectors/progressSelectors';

interface FeedbackToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'progress';
  open: boolean;
  onClose: () => void;
  duration?: number;
  action?: React.ReactNode;
  progress?: number;
  operation?: string;
  transition?: 'slide' | 'grow' | 'fade';
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

// Transition components
const SlideTransition = (props: TransitionProps) => {
  return <Slide {...props} direction="up" />;
};

const GrowTransition = (props: TransitionProps) => {
  return <Grow {...props} />;
};

const FadeTransition = (props: TransitionProps) => {
  return <Fade {...props} />;
};

export const FeedbackToast: React.FC<FeedbackToastProps> = ({
  message,
  type,
  open,
  onClose,
  duration = 6000,
  action,
  progress,
  operation,
  transition = 'slide',
  position = { vertical: 'bottom', horizontal: 'left' },
}) => {
  const getTransitionComponent = () => {
    switch (transition) {
      case 'grow':
        return GrowTransition;
      case 'fade':
        return FadeTransition;
      case 'slide':
      default:
        return SlideTransition;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      case 'progress':
        if (operation?.includes('upload') || operation?.includes('import')) {
          return <UploadIcon />;
        } else if (operation?.includes('download') || operation?.includes('export')) {
          return <DownloadIcon />;
        } else if (operation?.includes('save') || operation?.includes('create') || operation?.includes('update')) {
          return <SaveIcon />;
        } else if (operation?.includes('delete')) {
          return <DeleteIcon />;
        }
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverity = () => {
    return type === 'progress' ? 'info' : type;
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={type === 'progress' ? null : duration}
      onClose={onClose}
      anchorOrigin={position}
      TransitionComponent={getTransitionComponent()}
    >
      <Alert
        severity={getSeverity()}
        onClose={onClose}
        icon={getIcon()}
        sx={{
          minWidth: 300,
          maxWidth: 500,
        }}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            {action}
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={onClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <Box>
          <Typography variant="body2">
            {message}
          </Typography>
          {type === 'progress' && progress !== undefined && (
            <Box mt={1}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {Math.round(progress)}% complete
              </Typography>
            </Box>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

// Hook for easy feedback management
export const useFeedback = () => {
  const dispatch = useAppDispatch();
  const activeOperations = useAppSelector(selectActiveOperations);

  const showSuccess = (message: string, duration?: number) => {
    dispatch(addNotification({
      message,
      type: 'success',
      duration: duration || 4000,
    }));
  };

  const showError = (message: string, persistent?: boolean) => {
    dispatch(addNotification({
      message,
      type: 'error',
      duration: persistent ? undefined : 6000,
      persistent,
    }));
  };

  const showWarning = (message: string, duration?: number) => {
    dispatch(addNotification({
      message,
      type: 'warning',
      duration: duration || 5000,
    }));
  };

  const showInfo = (message: string, duration?: number) => {
    dispatch(addNotification({
      message,
      type: 'info',
      duration: duration || 4000,
    }));
  };

  const showProgress = (message: string, operation?: string) => {
    dispatch(addNotification({
      message,
      type: 'info', // We'll handle progress type in the component
      persistent: true,
    }));
  };

  // Auto-generate feedback for common operations
  const showOperationSuccess = (operation: 'create' | 'update' | 'delete', entity: string) => {
    const messages = {
      create: `${entity} created successfully`,
      update: `${entity} updated successfully`,
      delete: `${entity} deleted successfully`,
    };
    showSuccess(messages[operation]);
  };

  const showOperationError = (operation: 'create' | 'update' | 'delete', entity: string, error?: string) => {
    const messages = {
      create: `Failed to create ${entity}`,
      update: `Failed to update ${entity}`,
      delete: `Failed to delete ${entity}`,
    };
    const message = error ? `${messages[operation]}: ${error}` : messages[operation];
    showError(message);
  };

  const showValidationError = (field: string, message: string) => {
    showError(`${field}: ${message}`);
  };

  const showNetworkError = () => {
    showError('Network error. Please check your connection and try again.', true);
  };

  const showSaveSuccess = (entity: string) => {
    showSuccess(`${entity} saved successfully`);
  };

  const showLoadError = (entity: string) => {
    showError(`Failed to load ${entity}. Please try again.`);
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showProgress,
    showOperationSuccess,
    showOperationError,
    showValidationError,
    showNetworkError,
    showSaveSuccess,
    showLoadError,
    hasActiveOperations: activeOperations.length > 0,
  };
};

export default FeedbackToast;