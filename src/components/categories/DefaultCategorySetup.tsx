import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Circle as CircleIcon,
  Add as AddIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useDefaultCategories } from '../../hooks/useDefaultCategories';

export const DefaultCategorySetup: React.FC = () => {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const {
    categories,
    isInitializing,
    initializationError,
    forceCreateDefaults,
    getDefaultTemplates,
    isInitialized,
  } = useDefaultCategories();

  const templates = getDefaultTemplates();
  const hasCategories = categories.length > 0;

  const handleCreateDefaults = async () => {
    await forceCreateDefaults();
    setShowTemplateDialog(false);
  };

  if (hasCategories && isInitialized) {
    return null; // Don't show if categories already exist
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="h6">デフォルトカテゴリのセットアップ</Typography>
        </Box>

        {initializationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {initializationError}
          </Alert>
        )}

        {isInitializing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} />
            <Typography>デフォルトカテゴリを作成中...</Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              家計管理を始めるために、よく使われるカテゴリを自動で作成できます。
              後から編集や追加も可能です。
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      支出カテゴリ
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {templates.expense.length}個のカテゴリ
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {templates.expense.slice(0, 4).map((template) => (
                        <Chip
                          key={template.name}
                          label={template.name}
                          size="small"
                          sx={{ bgcolor: template.color, color: 'white' }}
                        />
                      ))}
                      {templates.expense.length > 4 && (
                        <Chip
                          label={`+${templates.expense.length - 4}個`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      収入カテゴリ
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {templates.income.length}個のカテゴリ
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {templates.income.map((template) => (
                        <Chip
                          key={template.name}
                          label={template.name}
                          size="small"
                          sx={{ bgcolor: template.color, color: 'white' }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateDefaults}
                disabled={isInitializing}
              >
                デフォルトカテゴリを作成
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowTemplateDialog(true)}
              >
                詳細を確認
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Template Details Dialog */}
      <Dialog
        open={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>デフォルトカテゴリの詳細</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                支出カテゴリ ({templates.expense.length}個)
              </Typography>
              <List dense>
                {templates.expense.map((template) => (
                  <ListItem key={template.name}>
                    <ListItemIcon>
                      <CircleIcon
                        sx={{ color: template.color, fontSize: 16 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={template.name}
                      secondary={template.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                収入カテゴリ ({templates.income.length}個)
              </Typography>
              <List dense>
                {templates.income.map((template) => (
                  <ListItem key={template.name}>
                    <ListItemIcon>
                      <CircleIcon
                        sx={{ color: template.color, fontSize: 16 }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={template.name}
                      secondary={template.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            これらのカテゴリは作成後に自由に編集・削除・追加できます。
            まずはデフォルトから始めて、必要に応じてカスタマイズしてください。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplateDialog(false)}>
            キャンセル
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateDefaults}
            disabled={isInitializing}
          >
            作成する
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
