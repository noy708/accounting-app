import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import { Menu as MenuIcon, AccountBalance } from '@mui/icons-material';

interface HeaderProps {
  drawerWidth: number;
  onMenuClick: () => void;
  showMenuButton: boolean;
}

const Header: React.FC<HeaderProps> = ({
  drawerWidth,
  onMenuClick,
  showMenuButton,
}) => {
  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar>
        {showMenuButton && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <AccountBalance sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap component="div">
            会計アプリ
          </Typography>
        </Box>

        {/* Future: Add user menu, notifications, etc. */}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
