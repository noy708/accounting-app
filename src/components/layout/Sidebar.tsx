import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  List as ListIcon,
  Category as CategoryIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  GetApp as ExportIcon,
  Publish as ImportIcon,
} from '@mui/icons-material';

interface SidebarProps {
  onItemClick?: () => void;
}

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  section?: string;
}

const navigationItems: NavigationItem[] = [
  { text: 'ダッシュボード', icon: <DashboardIcon />, path: '/' },
  {
    text: '取引を追加',
    icon: <AddIcon />,
    path: '/transactions/new',
    section: '取引管理',
  },
  { text: '取引一覧', icon: <ListIcon />, path: '/transactions' },
  {
    text: 'カテゴリ管理',
    icon: <CategoryIcon />,
    path: '/categories',
    section: 'カテゴリ',
  },
  {
    text: '月次レポート',
    icon: <ReportIcon />,
    path: '/reports/monthly',
    section: 'レポート',
  },
  {
    text: 'カテゴリ別レポート',
    icon: <ReportIcon />,
    path: '/reports/category',
  },
  { text: '年次レポート', icon: <ReportIcon />, path: '/reports/yearly' },
  {
    text: 'データエクスポート',
    icon: <ExportIcon />,
    path: '/data/export',
    section: 'データ管理',
  },
  { text: 'データインポート', icon: <ImportIcon />, path: '/data/import' },
  {
    text: '設定',
    icon: <SettingsIcon />,
    path: '/settings',
    section: 'その他',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (path: string) => {
    navigate(path);
    onItemClick?.();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderNavigationItems = () => {
    const items: React.ReactElement[] = [];
    let currentSection = '';

    navigationItems.forEach((item, index) => {
      // Add section header if this is a new section
      if (item.section && item.section !== currentSection) {
        currentSection = item.section;
        if (index > 0) {
          items.push(<Divider key={`divider-${index}`} sx={{ my: 1 }} />);
        }
        items.push(
          <Box key={`section-${index}`} sx={{ px: 2, py: 1 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              fontSize="0.75rem"
            >
              {item.section}
            </Typography>
          </Box>
        );
      }

      items.push(
        <ListItem key={item.path} disablePadding>
          <ListItemButton
            onClick={() => handleItemClick(item.path)}
            selected={isActive(item.path)}
            sx={{
              minHeight: 48,
              px: 2.5,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: 3,
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: '0.875rem',
              }}
            />
          </ListItemButton>
        </ListItem>
      );
    });

    return items;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar spacer for desktop */}
      <Toolbar />

      {/* Navigation items */}
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List sx={{ pt: 1 }}>{renderNavigationItems()}</List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center">
          会計アプリ v1.0
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;
