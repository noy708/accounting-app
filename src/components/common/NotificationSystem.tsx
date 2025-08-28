import React, { useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Stack,
  IconButton,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { 
  selectActiveNotifications, 
  selectNotificationsByType 
} from '../../store/selectors/errorSelectors';
import { 
  removeNotification, 
  clearExpiredNotifications 
} from '../../store/slices/errorSlice';

interface NotificationSystemProps {
  maxVisible?: number;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  maxVisible = 5,
  position = { vertical: 'top', horizontal: 'right' }
}) => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectActiveNotifications);
  
  // Clean up expired notifications periodically
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(clearExpiredNotifications());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [dispatch]);
  
  const handleClose = (notificationId: string) => {
    dispatch(removeNotification(notificationId));
  };
  
  // Show only the most recent notifications
  const visibleNotifications = notifications.slice(-maxVisible);
  
  // Don't render anything if no notifications
  if (visibleNotifications.length === 0) {
    return null;
  }
  
  return (
    <Box
      sx={{
        position: 'fixed',
        top: position.vertical === 'top' ? 16 : 'auto',
        bottom: position.vertical === 'bottom' ? 16 : 'auto',
        left: position.horizontal === 'left' ? 16 : 'auto',
        right: position.horizontal === 'right' ? 16 : 'auto',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <Stack spacing={1} sx={{ pointerEvents: 'auto' }}>
        {visibleNotifications.map((notification) => (
          <Snackbar
            key={notification.id}
            open={true}
            autoHideDuration={notification.persistent ? null : (notification.duration || 6000)}
            onClose={() => handleClose(notification.id)}
            anchorOrigin={position}
          >
            <Alert
              severity={notification.type}
              onClose={() => handleClose(notification.id)}
              sx={{
                minWidth: 300,
                maxWidth: 500,
              }}
              action={
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={() => handleClose(notification.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
            >
              {notification.message}
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </Box>
  );
};

export default NotificationSystem;