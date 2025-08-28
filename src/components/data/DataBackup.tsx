import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import {
  DataBackupService,
  BackupData,
  BackupOptions,
  RestoreOptions,
  BackupProgress,
} from '../../database/services/DataBackupService';

interface DataBackupProps {
  onBackupComplete?: (success: boolean) => void;
  onRestoreComplete?: (success: boolean) => void;
}

export const DataBackup: React.FC<DataBackupProps> = ({
  onBackupComplete,
  onRestoreComplete,
}) => {
  const [backupService] = useState(() => new DataBackupService());
  const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(false);
  const [autoBackupInterval, setAutoBackupInterval] = useState(60);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(
    null
  );
  const [autoBackups, setAutoBackups] = useState<BackupData[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupData | null>(null);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // バックアップオプション
  const [backupOptions, setBackupOptions] = useState<BackupOptions>({
    includeTransactions: true,
    includeCategories: true,
    compress: false,
  });

  // リストアオプション
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    skipDuplicates: true,
    validateIntegrity: true,
    createMissingCategories: false,
  });

  useEffect(() => {
    loadAutoBackups();
  }, []);

  const loadAutoBackups = () => {
    const backups = backupService.getAutoBackups();
    setAutoBackups(backups || []);
  };

  const handleAutoBackupToggle = (enabled: boolean) => {
    setIsAutoBackupEnabled(enabled);

    if (enabled) {
      backupService.startAutoBackup(autoBackupInterval);
      setAlert({
        type: 'success',
        message: `自動バックアップを開始しました（${autoBackupInterval}分間隔）`,
      });
    } else {
      backupService.stopAutoBackup();
      setAlert({
        type: 'info',
        message: '自動バックアップを停止しました',
      });
    }
  };

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(null);

    try {
      const backupData = await backupService.createManualBackup(
        backupOptions,
        (progress) => setBackupProgress(progress)
      );

      // バックアップファイルをダウンロード
      backupService.downloadBackup(backupData);

      setAlert({
        type: 'success',
        message: 'バックアップが正常に作成されました',
      });

      onBackupComplete?.(true);
      loadAutoBackups(); // 自動バックアップリストを更新
    } catch (error) {
      setAlert({
        type: 'error',
        message: `バックアップに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      onBackupComplete?.(false);
    } finally {
      setIsBackingUp(false);
      setBackupProgress(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRestoreFromFile = async () => {
    if (!selectedFile) {
      setAlert({
        type: 'error',
        message: 'バックアップファイルを選択してください',
      });
      return;
    }

    try {
      const fileContent = await selectedFile.text();
      const backupData: BackupData = JSON.parse(fileContent);

      // 日付文字列をDateオブジェクトに変換
      backupData.timestamp = new Date(backupData.timestamp);
      backupData.transactions = backupData.transactions.map((t) => ({
        ...t,
        date: new Date(t.date),
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));
      backupData.categories = backupData.categories.map((c) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      }));

      setSelectedBackup(backupData);
      setRestoreDialogOpen(true);
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'バックアップファイルの読み込みに失敗しました',
      });
    }
  };

  const handleRestoreFromAutoBackup = (backup: BackupData) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  const executeRestore = async () => {
    if (!selectedBackup) return;

    setIsRestoring(true);
    setRestoreDialogOpen(false);

    try {
      const result = await backupService.restoreFromBackup(
        selectedBackup,
        restoreOptions
      );

      if (result.success) {
        setAlert({
          type: 'success',
          message: `リストアが完了しました。取引: ${result.transactions.imported}件、カテゴリ: ${result.categories.imported}件をインポートしました。`,
        });
        onRestoreComplete?.(true);
      } else {
        setAlert({
          type: 'error',
          message: `リストアに失敗しました: ${result.errors.join(', ')}`,
        });
        onRestoreComplete?.(false);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: `リストアに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      onRestoreComplete?.(false);
    } finally {
      setIsRestoring(false);
      setSelectedBackup(null);
    }
  };

  const handleDownloadAutoBackup = (backup: BackupData) => {
    backupService.downloadBackup(backup);
  };

  const handleDeleteAutoBackup = (backup: BackupData) => {
    const backupKey = `auto_backup_${backup.timestamp.getTime()}`;
    localStorage.removeItem(backupKey);
    loadAutoBackups();
    setAlert({
      type: 'info',
      message: '自動バックアップを削除しました',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        データバックアップ・リストア
      </Typography>

      {alert && (
        <Alert
          severity={alert.type}
          onClose={() => setAlert(null)}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 自動バックアップ設定 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                自動バックアップ
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={isAutoBackupEnabled}
                    onChange={(e) => handleAutoBackupToggle(e.target.checked)}
                  />
                }
                label="自動バックアップを有効にする"
              />

              <TextField
                label="バックアップ間隔（分）"
                type="number"
                value={autoBackupInterval}
                onChange={(e) => setAutoBackupInterval(Number(e.target.value))}
                disabled={isAutoBackupEnabled}
                fullWidth
                margin="normal"
                inputProps={{ min: 1, max: 1440 }}
              />

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                自動バックアップはブラウザのローカルストレージに保存されます
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* 手動バックアップ */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BackupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                手動バックアップ
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={backupOptions.includeTransactions}
                    onChange={(e) =>
                      setBackupOptions((prev) => ({
                        ...prev,
                        includeTransactions: e.target.checked,
                      }))
                    }
                  />
                }
                label="取引データを含める"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={backupOptions.includeCategories}
                    onChange={(e) =>
                      setBackupOptions((prev) => ({
                        ...prev,
                        includeCategories: e.target.checked,
                      }))
                    }
                  />
                }
                label="カテゴリデータを含める"
              />

              <Button
                variant="contained"
                onClick={handleManualBackup}
                disabled={
                  isBackingUp ||
                  (!backupOptions.includeTransactions &&
                    !backupOptions.includeCategories)
                }
                startIcon={<BackupIcon />}
                fullWidth
                sx={{ mt: 2 }}
              >
                {isBackingUp ? 'バックアップ中...' : 'バックアップを作成'}
              </Button>

              {backupProgress && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    {backupProgress.message}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={backupProgress.current}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ファイルからリストア */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <RestoreIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                ファイルからリストア
              </Typography>

              <input
                accept=".json"
                style={{ display: 'none' }}
                id="backup-file-input"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="backup-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  バックアップファイルを選択
                </Button>
              </label>

              {selectedFile && (
                <Typography variant="body2" gutterBottom>
                  選択されたファイル: {selectedFile.name}
                </Typography>
              )}

              <Button
                variant="contained"
                onClick={handleRestoreFromFile}
                disabled={!selectedFile || isRestoring}
                startIcon={<RestoreIcon />}
                fullWidth
              >
                {isRestoring ? 'リストア中...' : 'リストアを実行'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 自動バックアップ履歴 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                自動バックアップ履歴
              </Typography>

              {autoBackups.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  自動バックアップがありません
                </Typography>
              ) : (
                <List dense>
                  {autoBackups.map((backup, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={formatDate(backup.timestamp)}
                        secondary={
                          <Box>
                            <Chip
                              label={`取引: ${backup.metadata.transactionCount}`}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={`カテゴリ: ${backup.metadata.categoryCount}`}
                              size="small"
                            />
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDownloadAutoBackup(backup)}
                          title="ダウンロード"
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleRestoreFromAutoBackup(backup)}
                          title="リストア"
                        >
                          <RestoreIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteAutoBackup(backup)}
                          title="削除"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* リストア確認ダイアログ */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>リストア設定</DialogTitle>
        <DialogContent>
          {selectedBackup && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                バックアップ情報
              </Typography>
              <Typography variant="body2">
                作成日時: {formatDate(selectedBackup.timestamp)}
              </Typography>
              <Typography variant="body2">
                取引数: {selectedBackup.metadata.transactionCount}件
              </Typography>
              <Typography variant="body2">
                カテゴリ数: {selectedBackup.metadata.categoryCount}件
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            リストアオプション
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={restoreOptions.skipDuplicates}
                onChange={(e) =>
                  setRestoreOptions((prev) => ({
                    ...prev,
                    skipDuplicates: e.target.checked,
                  }))
                }
              />
            }
            label="重複データをスキップ"
          />

          <FormControlLabel
            control={
              <Switch
                checked={restoreOptions.validateIntegrity}
                onChange={(e) =>
                  setRestoreOptions((prev) => ({
                    ...prev,
                    validateIntegrity: e.target.checked,
                  }))
                }
              />
            }
            label="データ整合性をチェック"
          />

          <FormControlLabel
            control={
              <Switch
                checked={restoreOptions.createMissingCategories}
                onChange={(e) =>
                  setRestoreOptions((prev) => ({
                    ...prev,
                    createMissingCategories: e.target.checked,
                  }))
                }
              />
            }
            label="不足カテゴリを自動作成"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>
            キャンセル
          </Button>
          <Button onClick={executeRestore} variant="contained">
            リストアを実行
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
