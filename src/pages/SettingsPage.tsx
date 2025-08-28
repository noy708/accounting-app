import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

const SettingsPage: React.FC = () => {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        設定
      </Typography>
      
      <Paper sx={{ mt: 2 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText
              primary="通知"
              secondary="アプリケーションからの通知を受け取る"
            />
            <Switch
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <PaletteIcon />
            </ListItemIcon>
            <ListItemText
              primary="ダークモード"
              secondary="ダークテーマを使用する"
            />
            <Switch
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <LanguageIcon />
            </ListItemIcon>
            <ListItemText
              primary="言語"
              secondary="日本語"
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText
              primary="セキュリティ"
              secondary="データの暗号化とバックアップ設定"
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default SettingsPage;