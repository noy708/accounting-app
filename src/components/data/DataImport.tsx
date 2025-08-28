import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  LinearProgress,
  Typography,
  Alert,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Upload,
  FileUpload,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import {
  DataImportService,
  ImportOptions,
  ImportProgress,
  ImportResult,
  ImportError,
} from '../../database/services/DataImportService';

interface DataImportProps {
  onClose?: () => void;
  onImportComplete?: (result: ImportResult) => void;
}

export const DataImport: React.FC<DataImportProps> = ({
  onClose,
  onImportComplete,
}) => {
  const [importService] = useState(() => new DataImportService());
  const transactionFileRef = useRef<HTMLInputElement>(null);
  const categoryFileRef = useRef<HTMLInputElement>(null);

  // File state
  const [transactionFile, setTransactionFile] = useState<File | null>(null);
  const [categoryFile, setCategoryFile] = useState<File | null>(null);
  const [transactionContent, setTransactionContent] = useState<string>('');
  const [categoryContent, setCategoryContent] = useState<string>('');

  // Import options state
  const [options, setOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    updateExisting: false,
    createMissingCategories: true,
  });

  // UI state
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const handleFileSelect =
    (type: 'transaction' | 'category') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('CSVファイルを選択してください');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (type === 'transaction') {
          setTransactionFile(file);
          setTransactionContent(content);
        } else {
          setCategoryFile(file);
          setCategoryContent(content);
        }
      };
      reader.readAsText(file, 'UTF-8');
    };

  const handleRemoveFile = (type: 'transaction' | 'category') => () => {
    if (type === 'transaction') {
      setTransactionFile(null);
      setTransactionContent('');
      if (transactionFileRef.current) {
        transactionFileRef.current.value = '';
      }
    } else {
      setCategoryFile(null);
      setCategoryContent('');
      if (categoryFileRef.current) {
        categoryFileRef.current.value = '';
      }
    }
  };

  const handleOptionChange =
    (field: keyof ImportOptions) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setOptions((prev) => ({
        ...prev,
        [field]: event.target.checked,
      }));
    };

  const handleImportClick = () => {
    if (!transactionFile && !categoryFile) {
      setError('インポートするファイルを選択してください');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmImport = async () => {
    setShowConfirmDialog(false);
    setIsImporting(true);
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const importResult = await importService.importFromCSV(
        transactionContent || undefined,
        categoryContent || undefined,
        options,
        setProgress
      );

      setResult(importResult);
      setShowResultDialog(true);
      onImportComplete?.(importResult);
    } catch (err) {
      const errorMessage = (err as Error)?.message || 'インポートに失敗しました';
      setError(errorMessage);
    } finally {
      setIsImporting(false);
      setProgress(null);
    }
  };

  const handleCloseResult = () => {
    setShowResultDialog(false);
    // Reset files after successful import
    if (
      result &&
      (result.transactions.imported > 0 || result.categories.imported > 0)
    ) {
      setTransactionFile(null);
      setCategoryFile(null);
      setTransactionContent('');
      setCategoryContent('');
      if (transactionFileRef.current) transactionFileRef.current.value = '';
      if (categoryFileRef.current) categoryFileRef.current.value = '';
    }
  };

  const progressPercentage = progress
    ? (progress.current / progress.total) * 100
    : 0;
  const hasFiles = transactionFile || categoryFile;

  return (
    <>
      <Card sx={{ maxWidth: 600, mx: 'auto' }}>
        <CardHeader title="データインポート" avatar={<FileUpload />} />
        <CardContent>
          <Stack spacing={3}>
            {/* File Selection */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                インポートファイル
              </Typography>

              {/* Transaction File */}
              <Box sx={{ mb: 2 }}>
                <input
                  ref={transactionFileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect('transaction')}
                  style={{ display: 'none' }}
                />
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="outlined"
                    onClick={() => transactionFileRef.current?.click()}
                    disabled={isImporting}
                  >
                    取引データを選択
                  </Button>
                  {transactionFile && (
                    <Chip
                      label={transactionFile.name}
                      onDelete={handleRemoveFile('transaction')}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>

              {/* Category File */}
              <Box>
                <input
                  ref={categoryFileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect('category')}
                  style={{ display: 'none' }}
                />
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="outlined"
                    onClick={() => categoryFileRef.current?.click()}
                    disabled={isImporting}
                  >
                    カテゴリデータを選択
                  </Button>
                  {categoryFile && (
                    <Chip
                      label={categoryFile.name}
                      onDelete={handleRemoveFile('category')}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>
            </Box>

            <Divider />

            {/* Import Options */}
            <FormControl component="fieldset">
              <FormLabel component="legend">インポートオプション</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.skipDuplicates}
                      onChange={handleOptionChange('skipDuplicates')}
                    />
                  }
                  label="重複データをスキップ"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.updateExisting}
                      onChange={handleOptionChange('updateExisting')}
                      disabled={options.skipDuplicates}
                    />
                  }
                  label="既存データを更新"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.createMissingCategories}
                      onChange={handleOptionChange('createMissingCategories')}
                    />
                  }
                  label="存在しないカテゴリを自動作成"
                />
              </FormGroup>
            </FormControl>

            {/* Progress */}
            {progress && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  {progress.message}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progressPercentage}
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {progress.current} / {progress.total} 完了
                </Typography>
              </Box>
            )}

            {/* Error Message */}
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* File Format Info */}
            <Alert severity="info">
              <Typography variant="body2" gutterBottom>
                <strong>CSVファイル形式について:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                <strong>取引データ:</strong> 日付, 金額, 種類, カテゴリ, 説明
                <br />
                <strong>カテゴリデータ:</strong> カテゴリ名, 色, 種類,
                デフォルト
                <br />※ エクスポート機能で出力されたCSVファイルと同じ形式です
              </Typography>
            </Alert>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {onClose && (
                <Button onClick={onClose} disabled={isImporting}>
                  キャンセル
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={handleImportClick}
                disabled={isImporting || !hasFiles}
              >
                {isImporting ? 'インポート中...' : 'インポート'}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Warning color="warning" />
            <Typography>インポート確認</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            以下の設定でデータをインポートします。よろしいですか？
          </Typography>

          <List dense>
            {transactionFile && (
              <ListItem>
                <ListItemText
                  primary="取引データ"
                  secondary={transactionFile.name}
                />
              </ListItem>
            )}
            {categoryFile && (
              <ListItem>
                <ListItemText
                  primary="カテゴリデータ"
                  secondary={categoryFile.name}
                />
              </ListItem>
            )}
          </List>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            オプション:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary={
                  options.skipDuplicates
                    ? '✓ 重複データをスキップ'
                    : '✗ 重複データをスキップしない'
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={
                  options.updateExisting
                    ? '✓ 既存データを更新'
                    : '✗ 既存データを更新しない'
                }
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={
                  options.createMissingCategories
                    ? '✓ 存在しないカテゴリを自動作成'
                    : '✗ 存在しないカテゴリを自動作成しない'
                }
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>
            キャンセル
          </Button>
          <Button onClick={handleConfirmImport} variant="contained">
            インポート実行
          </Button>
        </DialogActions>
      </Dialog>

      {/* Result Dialog */}
      <Dialog
        open={showResultDialog}
        onClose={handleCloseResult}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            {result && result.errors.length === 0 ? (
              <CheckCircle color="success" />
            ) : (
              <Warning color="warning" />
            )}
            <Typography>インポート結果</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {result && (
            <Stack spacing={3}>
              {/* Summary */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  サマリー
                </Typography>
                <Stack direction="row" spacing={4}>
                  <Box>
                    <Typography variant="subtitle2">取引</Typography>
                    <Typography color="success.main">
                      インポート: {result.transactions.imported}
                    </Typography>
                    <Typography color="warning.main">
                      スキップ: {result.transactions.skipped}
                    </Typography>
                    <Typography color="error.main">
                      エラー: {result.transactions.errors}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">カテゴリ</Typography>
                    <Typography color="success.main">
                      インポート: {result.categories.imported}
                    </Typography>
                    <Typography color="warning.main">
                      スキップ: {result.categories.skipped}
                    </Typography>
                    <Typography color="error.main">
                      エラー: {result.categories.errors}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Errors */}
              {result.errors.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom color="error">
                    エラー詳細
                  </Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>行</TableCell>
                          <TableCell>フィールド</TableCell>
                          <TableCell>メッセージ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.errors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row || '-'}</TableCell>
                            <TableCell>{error.field || '-'}</TableCell>
                            <TableCell>{error.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResult} variant="contained">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
export default DataImport;