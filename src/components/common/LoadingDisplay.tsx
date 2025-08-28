import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Backdrop,
  Card,
  CardContent,
  Skeleton,
} from '@mui/material';

interface LoadingDisplayProps {
  loading: boolean;
  type?: 'circular' | 'linear' | 'backdrop' | 'skeleton' | 'inline';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
  children?: React.ReactNode;
  skeletonLines?: number;
  progress?: number; // 0-100 for determinate progress
}

const LoadingDisplay: React.FC<LoadingDisplayProps> = ({
  loading,
  type = 'circular',
  message,
  size = 'medium',
  overlay = false,
  children,
  skeletonLines = 3,
  progress,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 40;
      case 'large':
        return 60;
      default:
        return 40;
    }
  };

  const renderCircularLoader = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 2,
      }}
    >
      <CircularProgress
        size={getSize()}
        variant={progress !== undefined ? 'determinate' : 'indeterminate'}
        value={progress}
      />
      {message && (
        <Typography variant="body2" color="text.secondary" align="center">
          {message}
        </Typography>
      )}
      {progress !== undefined && (
        <Typography variant="caption" color="text.secondary">
          {Math.round(progress)}%
        </Typography>
      )}
    </Box>
  );

  const renderLinearLoader = () => (
    <Box sx={{ width: '100%', mb: 2 }}>
      {message && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {message}
        </Typography>
      )}
      <LinearProgress
        variant={progress !== undefined ? 'determinate' : 'indeterminate'}
        value={progress}
      />
      {progress !== undefined && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {Math.round(progress)}%
        </Typography>
      )}
    </Box>
  );

  const renderBackdropLoader = () => (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={loading}
    >
      <Card sx={{ minWidth: 200, textAlign: 'center' }}>
        <CardContent>
          <CircularProgress
            size={getSize()}
            sx={{ mb: 2 }}
            variant={progress !== undefined ? 'determinate' : 'indeterminate'}
            value={progress}
          />
          {message && (
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          )}
          {progress !== undefined && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              {Math.round(progress)}%
            </Typography>
          )}
        </CardContent>
      </Card>
    </Backdrop>
  );

  const renderSkeletonLoader = () => (
    <Box sx={{ width: '100%' }}>
      {Array.from({ length: skeletonLines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height={size === 'small' ? 20 : size === 'large' ? 32 : 24}
          sx={{ mb: 1 }}
          width={index === skeletonLines - 1 ? '60%' : '100%'}
        />
      ))}
    </Box>
  );

  const renderInlineLoader = () => (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <CircularProgress
        size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
      />
      {message && (
        <Typography variant={size === 'small' ? 'caption' : 'body2'}>
          {message}
        </Typography>
      )}
    </Box>
  );

  if (!loading && type !== 'backdrop') {
    return <>{children}</>;
  }

  const renderLoader = () => {
    switch (type) {
      case 'linear':
        return renderLinearLoader();
      case 'backdrop':
        return renderBackdropLoader();
      case 'skeleton':
        return renderSkeletonLoader();
      case 'inline':
        return renderInlineLoader();
      case 'circular':
      default:
        return renderCircularLoader();
    }
  };

  if (overlay && type !== 'backdrop') {
    return (
      <Box sx={{ position: 'relative' }}>
        {children}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 1,
            }}
          >
            {renderLoader()}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <>
      {renderLoader()}
      {!loading && children}
    </>
  );
};

export default LoadingDisplay;
