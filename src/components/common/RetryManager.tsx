import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Box,
  Chip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { 
  selectPendingRetries, 
  selectFailedRetries 
} from '../../store/selectors/errorSelectors';
import { 
  removeFromRetryQueue, 
  clearRetryQueue,
  addNotification 
} from '../../store/slices/errorSlice';

interface RetryManagerProps {
  open: boolean;
  onClose: () => void;
}

export const RetryManager: React.FC<RetryManagerProps> = ({ open, onClose }) => {
  const dispatch = useAppDispatch();
  const pendingRetries = useAppSelector(selectPendingRetries);
  const failedRetries = useAppSelector(selectFailedRetries);
  
  // Auto-process retry queue
  useEffect(() => {
    if (pendingRetries.length > 0) {
      const interval = setInterval(() => {
        dispatch({ type: 'errors/processRetryQueue' });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [pendingRetries.length, dispatch]);
  
  const handleCancelRetry = (retryId: string) => {
    dispatch(removeFromRetryQueue(retryId));
    dispatch(addNotification({
      message: '再試行をキャンセルしました',
      type: 'info',
      duration: 3000,
    }));
  };
  
  const handleClearAll = () => {
    dispatch(clearRetryQueue());
    dispatch(addNotification({
      message: 'すべての再試行をクリアしました',
      type: 'info',
      duration: 3000,
    }));
  };
  
  const formatTimeRemaining = (nextRetryAt: number) => {
    const remaining = Math.max(0, nextRetryAt - Date.now());
    return Math.ceil(remaining / 1000);
  };
  
  const hasRetries = pendingRetries.length > 0 || failedRetries.length > 0;
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <RefreshIcon />
          再試行管理
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!hasRetries ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            現在再試行中の操作はありません
          </Typography>
        ) : (
          <Box>
            {pendingRetries.length > 0 && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  再試行待ち ({pendingRetries.length})
                </Typography>
                <List>
                  {pendingRetries.map((retry) => (
                    <ListItem key={retry.id} divider>
                      <ListItemText
                        primary={retry.error.message}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              試行回数: {retry.retryCount + 1}/{retry.maxRetries}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={1}>
                              <Typography variant="body2">
                                次回実行まで: {formatTimeRemaining(retry.nextRetryAt)}秒
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={(retry.retryCount / retry.maxRetries) * 100}
                                sx={{ flexGrow: 1, ml: 1 }}
                              />
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleCancelRetry(retry.id)}
                          size="small"
                        >
                          <CancelIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {failedRetries.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  再試行失敗 ({failedRetries.length})
                </Typography>
                <List>
                  {failedRetries.map((retry) => (
                    <ListItem key={retry.id} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <ErrorIcon color="error" fontSize="small" />
                            {retry.error.message}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              最大再試行回数に達しました ({retry.maxRetries}回)
                            </Typography>
                            <Chip
                              label={retry.error.type}
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleCancelRetry(retry.id)}
                          size="small"
                        >
                          <CancelIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {hasRetries && (
          <Button onClick={handleClearAll} color="secondary">
            すべてクリア
          </Button>
        )}
        <Button onClick={onClose}>
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RetryManager;