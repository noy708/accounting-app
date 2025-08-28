import React from 'react';
import {
  Backdrop,
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fade,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  selectActiveOperations,
  selectOverallProgress,
  selectEstimatedTimeRemaining,
  selectHasActiveOperations,
} from '../../store/selectors/progressSelectors';
import {
  cancelOperation,
  clearAllOperations,
} from '../../store/slices/progressSlice';
import LoadingDisplay from './LoadingDisplay';

interface GlobalLoadingOverlayProps {
  open?: boolean;
  onClose?: () => void;
  allowCancel?: boolean;
  allowMinimize?: boolean;
  showDetails?: boolean;
  variant?: 'simple' | 'detailed' | 'compact';
}

export const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({
  open,
  onClose,
  allowCancel = true,
  allowMinimize = true,
  showDetails = true,
  variant = 'detailed',
}) => {
  const dispatch = useAppDispatch();
  const activeOperations = useAppSelector(selectActiveOperations);
  const overallProgress = useAppSelector(selectOverallProgress);
  const estimatedTimeRemaining = useAppSelector(selectEstimatedTimeRemaining);
  const hasActiveOperations = useAppSelector(selectHasActiveOperations);

  const [minimized, setMinimized] = React.useState(false);
  const [showOperationDetails, setShowOperationDetails] = React.useState(false);

  const isOpen = open !== undefined ? open : hasActiveOperations;

  const handleCancel = (operationId?: string) => {
    if (operationId) {
      dispatch(cancelOperation(operationId));
    } else {
      dispatch(clearAllOperations());
    }
    onClose?.();
  };

  const formatTimeRemaining = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatElapsedTime = (startTime: number) => {
    const elapsed = Date.now() - startTime;
    return formatTimeRemaining(elapsed);
  };

  if (!isOpen) return null;

  if (variant === 'simple') {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(2px)',
        }}
        open={isOpen}
      >
        <LoadingDisplay
          loading={true}
          type="backdrop"
          message={activeOperations[0]?.message || 'Processing...'}
          progress={overallProgress < 100 ? overallProgress : undefined}
        />
      </Backdrop>
    );
  }

  if (variant === 'compact' || minimized) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(1px)',
        }}
        open={isOpen}
      >
        <Fade in={isOpen}>
          <Card
            sx={{
              minWidth: 300,
              maxWidth: 400,
              position: 'fixed',
              bottom: 24,
              right: 24,
            }}
          >
            <CardContent sx={{ pb: 2 }}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <Typography variant="subtitle1">
                  {activeOperations.length} operation
                  {activeOperations.length !== 1 ? 's' : ''} running
                </Typography>
                <Box>
                  {allowMinimize && !minimized && (
                    <IconButton size="small" onClick={() => setMinimized(true)}>
                      <MinimizeIcon />
                    </IconButton>
                  )}
                  {minimized && (
                    <IconButton
                      size="small"
                      onClick={() => setMinimized(false)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )}
                  {allowCancel && (
                    <IconButton size="small" onClick={() => handleCancel()}>
                      <CloseIcon />
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Box mb={2}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1}
                >
                  <Typography variant="body2">Overall Progress</Typography>
                  {estimatedTimeRemaining && (
                    <Typography variant="caption" color="text.secondary">
                      ~{formatTimeRemaining(estimatedTimeRemaining)} remaining
                    </Typography>
                  )}
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={overallProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {Math.round(overallProgress)}% complete
                </Typography>
              </Box>

              {!minimized &&
                activeOperations.slice(0, 3).map((operation) => (
                  <Box key={operation.id} mb={1}>
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{ flex: 1, mr: 1 }}
                      >
                        {operation.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatElapsedTime(operation.startTime)}
                      </Typography>
                    </Box>
                    {operation.message && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {operation.message}
                      </Typography>
                    )}
                  </Box>
                ))}

              {activeOperations.length > 3 && !minimized && (
                <Typography variant="caption" color="text.secondary">
                  +{activeOperations.length - 3} more operations
                </Typography>
              )}
            </CardContent>
          </Card>
        </Fade>
      </Backdrop>
    );
  }

  // Detailed variant
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backdropFilter: 'blur(3px)',
      }}
      open={isOpen}
    >
      <Fade in={isOpen}>
        <Card
          sx={{
            minWidth: 400,
            maxWidth: 600,
            maxHeight: '80vh',
            overflow: 'auto',
          }}
        >
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={3}
            >
              <Typography variant="h6">Operations in Progress</Typography>
              <Box>
                {allowMinimize && (
                  <IconButton onClick={() => setMinimized(true)}>
                    <MinimizeIcon />
                  </IconButton>
                )}
                {allowCancel && (
                  <IconButton onClick={() => handleCancel()}>
                    <CloseIcon />
                  </IconButton>
                )}
              </Box>
            </Box>

            <Box mb={3}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <Typography variant="subtitle1">
                  Overall Progress ({activeOperations.length} operations)
                </Typography>
                {estimatedTimeRemaining && (
                  <Chip
                    label={`~${formatTimeRemaining(estimatedTimeRemaining)} remaining`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={overallProgress}
                sx={{ height: 12, borderRadius: 6, mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {Math.round(overallProgress)}% complete
              </Typography>
            </Box>

            {showDetails && (
              <Box>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="between"
                  mb={2}
                >
                  <Typography variant="subtitle2">Active Operations</Typography>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setShowOperationDetails(!showOperationDetails)
                    }
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <List dense>
                  {activeOperations.map((operation) => (
                    <ListItem key={operation.id}>
                      <ListItemIcon>
                        <LoadingDisplay
                          loading={true}
                          type="circular"
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={operation.name}
                        secondary={
                          <Box>
                            {operation.message && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {operation.message}
                              </Typography>
                            )}
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={2}
                              mt={0.5}
                            >
                              <Typography variant="caption">
                                Running for{' '}
                                {formatElapsedTime(operation.startTime)}
                              </Typography>
                              {!operation.indeterminate && (
                                <Typography variant="caption">
                                  {Math.round(operation.progress)}%
                                </Typography>
                              )}
                            </Box>
                            {!operation.indeterminate && (
                              <LinearProgress
                                variant="determinate"
                                value={operation.progress}
                                sx={{ mt: 1, height: 4, borderRadius: 2 }}
                              />
                            )}
                          </Box>
                        }
                      />
                      {allowCancel && (
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleCancel(operation.id)}
                        >
                          <CloseIcon />
                        </IconButton>
                      )}
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </CardContent>
        </Card>
      </Fade>
    </Backdrop>
  );
};

export default GlobalLoadingOverlay;
