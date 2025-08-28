import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Card,
  CardContent,
  IconButton,
  Collapse,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  selectActiveOperations,
  selectCompletedOperations,
  selectFailedOperations,
  selectOverallProgress,
  selectEstimatedTimeRemaining,
  selectHasActiveOperations,
} from '../../store/selectors/progressSelectors';
import { cancelOperation, clearCompletedOperations } from '../../store/slices/progressSlice';

interface ProgressDisplayProps {
  variant?: 'compact' | 'detailed' | 'minimal';
  showCompleted?: boolean;
  showFailed?: boolean;
  maxItems?: number;
  onOperationCancel?: (id: string) => void;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  variant = 'compact',
  showCompleted = true,
  showFailed = true,
  maxItems = 5,
  onOperationCancel,
}) => {
  const dispatch = useAppDispatch();
  const activeOperations = useAppSelector(selectActiveOperations);
  const completedOperations = useAppSelector(selectCompletedOperations);
  const failedOperations = useAppSelector(selectFailedOperations);
  const overallProgress = useAppSelector(selectOverallProgress);
  const estimatedTimeRemaining = useAppSelector(selectEstimatedTimeRemaining);
  const hasActiveOperations = useAppSelector(selectHasActiveOperations);
  
  const [expanded, setExpanded] = React.useState(false);
  
  const handleCancel = (id: string) => {
    dispatch(cancelOperation(id));
    onOperationCancel?.(id);
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
  
  if (!hasActiveOperations && completedOperations.length === 0 && failedOperations.length === 0) {
    return null;
  }
  
  if (variant === 'minimal') {
    return hasActiveOperations ? (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">
          {activeOperations.length} operation{activeOperations.length !== 1 ? 's' : ''} in progress
        </Typography>
      </Box>
    ) : null;
  }
  
  if (variant === 'compact') {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="subtitle2">
              Operations ({activeOperations.length} active)
            </Typography>
            {(completedOperations.length > 0 || failedOperations.length > 0) && (
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                aria-label={expanded ? "collapse" : "expand"}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Box>
          
          {hasActiveOperations && (
            <Box mb={2}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  Overall Progress
                </Typography>
                {estimatedTimeRemaining && (
                  <Typography variant="caption" color="text.secondary">
                    ~{formatTimeRemaining(estimatedTimeRemaining)} remaining
                  </Typography>
                )}
              </Box>
              <LinearProgress
                variant="determinate"
                value={overallProgress}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}
          
          {activeOperations.slice(0, maxItems).map((operation) => (
            <Box key={operation.id} mb={1}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" noWrap sx={{ flex: 1, mr: 1 }}>
                  {operation.name}
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="caption" color="text.secondary">
                    {formatElapsedTime(operation.startTime)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleCancel(operation.id)}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {operation.message && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {operation.message}
                </Typography>
              )}
              {!operation.indeterminate && (
                <LinearProgress
                  variant="determinate"
                  value={operation.progress}
                  size="small"
                  sx={{ mt: 0.5, height: 4 }}
                />
              )}
            </Box>
          ))}
          
          <Collapse in={expanded}>
            <Divider sx={{ my: 1 }} />
            
            {showCompleted && completedOperations.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="success.main" gutterBottom>
                  Completed ({completedOperations.length})
                </Typography>
                {completedOperations.slice(0, maxItems).map((operation) => (
                  <Box key={operation.id} display="flex" alignItems="center" gap={1} mb={0.5}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {operation.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatElapsedTime(operation.startTime)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
            
            {showFailed && failedOperations.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" color="error.main" gutterBottom>
                  Failed ({failedOperations.length})
                </Typography>
                {failedOperations.slice(0, maxItems).map((operation) => (
                  <Box key={operation.id} mb={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ErrorIcon color="error" fontSize="small" />
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {operation.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatElapsedTime(operation.startTime)}
                      </Typography>
                    </Box>
                    {operation.message && (
                      <Typography variant="caption" color="error.main" display="block" ml={3}>
                        {operation.message}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            )}
            
            {(completedOperations.length > 0 || failedOperations.length > 0) && (
              <Box textAlign="right">
                <Chip
                  label="Clear History"
                  size="small"
                  variant="outlined"
                  onClick={() => dispatch(clearCompletedOperations())}
                />
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>
    );
  }
  
  // Detailed variant
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Operation Progress
        </Typography>
        
        {hasActiveOperations && (
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Active Operations ({activeOperations.length})
            </Typography>
            <List dense>
              {activeOperations.map((operation) => (
                <ListItem key={operation.id}>
                  <ListItemIcon>
                    {operation.indeterminate ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Box position="relative" display="inline-flex">
                        <CircularProgress
                          variant="determinate"
                          value={operation.progress}
                          size={24}
                        />
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          bottom={0}
                          right={0}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Typography variant="caption" component="div" color="text.secondary">
                            {Math.round(operation.progress)}%
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={operation.name}
                    secondary={
                      <Box>
                        {operation.message && (
                          <Typography variant="body2" color="text.secondary">
                            {operation.message}
                          </Typography>
                        )}
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <ScheduleIcon fontSize="small" />
                          <Typography variant="caption">
                            {formatElapsedTime(operation.startTime)}
                          </Typography>
                          {operation.estimatedDuration && !operation.indeterminate && (
                            <Typography variant="caption" color="text.secondary">
                              / ~{formatTimeRemaining(operation.estimatedDuration)}
                            </Typography>
                          )}
                        </Box>
                        {!operation.indeterminate && (
                          <LinearProgress
                            variant="determinate"
                            value={operation.progress}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <IconButton
                    edge="end"
                    onClick={() => handleCancel(operation.id)}
                  >
                    <CancelIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        
        {showCompleted && completedOperations.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle1" color="success.main" gutterBottom>
              Completed Operations ({completedOperations.length})
            </Typography>
            <List dense>
              {completedOperations.map((operation) => (
                <ListItem key={operation.id}>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={operation.name}
                    secondary={`Completed in ${formatElapsedTime(operation.startTime)}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        
        {showFailed && failedOperations.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle1" color="error.main" gutterBottom>
              Failed Operations ({failedOperations.length})
            </Typography>
            <List dense>
              {failedOperations.map((operation) => (
                <ListItem key={operation.id}>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={operation.name}
                    secondary={
                      <Box>
                        {operation.message && (
                          <Typography variant="body2" color="error.main">
                            {operation.message}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          Failed after {formatElapsedTime(operation.startTime)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressDisplay;