import React, { useState, useEffect } from 'react';
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
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import DatePicker from '../common/DatePicker';
import { Download, FileDownload } from '@mui/icons-material';
import {
  DataExportService,
  ExportOptions,
  ExportProgress,
} from '../../database/services/DataExportService';
import { useAppSelector } from '../../store/hooks';
import { selectCategories } from '../../store/selectors/categorySelectors';

interface DataExportProps {
  onClose?: () => void;
}

export const DataExport: React.FC<DataExportProps> = ({ onClose }) => {
  const categories = useAppSelector(selectCategories);
  const [exportService] = useState(() => new DataExportService());

  // Export options state
  const [options, setOptions] = useState<ExportOptions>({
    includeTransactions: true,
    includeCategories: true,
  });

  // Date range state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // UI state
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update options when date range changes
  useEffect(() => {
    setOptions((prev) => ({
      ...prev,
      dateRange: startDate && endDate ? { startDate, endDate } : undefined,
    }));
  }, [startDate, endDate]);

  // Update options when category selection changes
  useEffect(() => {
    setOptions((prev) => ({
      ...prev,
      categoryIds:
        selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
    }));
  }, [selectedCategoryIds]);

  const handleExportOptionChange =
    (field: keyof ExportOptions) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setOptions((prev) => ({
        ...prev,
        [field]: event.target.checked,
      }));
    };

  const handleCategorySelection = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAllCategories = () => {
    if (selectedCategoryIds.length === categories.length) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(categories.map((c) => c.id));
    }
  };

  const handleExport = async () => {
    if (!options.includeTransactions && !options.includeCategories) {
      setError('エクスポートする項目を選択してください');
      return;
    }

    setIsExporting(true);
    setError(null);
    setSuccess(null);
    setProgress(null);

    try {
      const result = await exportService.exportToCSV(options, setProgress);

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:-]/g, '');

      // Download files
      if (result.transactions) {
        exportService.downloadCSV(
          result.transactions,
          `取引データ_${timestamp}.csv`
        );
      }

      if (result.categories) {
        exportService.downloadCSV(
          result.categories,
          `カテゴリデータ_${timestamp}.csv`
        );
      }

      setSuccess('データのエクスポートが完了しました');

      // Auto close after success
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'エクスポートに失敗しました'
      );
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  };

  const progressPercentage = progress
    ? (progress.current / progress.total) * 100
    : 0;

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardHeader title="データエクスポート" avatar={<FileDownload />} />
      <CardContent>
        <Stack spacing={3}>
          {/* Export Options */}
          <FormControl component="fieldset">
            <FormLabel component="legend">エクスポート項目</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.includeTransactions}
                    onChange={handleExportOptionChange('includeTransactions')}
                  />
                }
                label="取引データ"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.includeCategories}
                    onChange={handleExportOptionChange('includeCategories')}
                  />
                }
                label="カテゴリデータ"
              />
            </FormGroup>
          </FormControl>

          {/* Date Range Filter */}
          {options.includeTransactions && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                期間指定（オプション）
              </Typography>
              <Stack direction="row" spacing={2}>
                <DatePicker
                  label="開始日"
                  value={startDate}
                  onChange={setStartDate}
                  size="small"
                />
                <DatePicker
                  label="終了日"
                  value={endDate}
                  onChange={setEndDate}
                  size="small"
                />
              </Stack>
            </Box>
          )}

          {/* Category Filter */}
          {options.includeTransactions && categories.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                カテゴリ指定（オプション）
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Button
                  size="small"
                  onClick={handleSelectAllCategories}
                  variant="outlined"
                >
                  {selectedCategoryIds.length === categories.length
                    ? '全て解除'
                    : '全て選択'}
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    label={category.name}
                    onClick={() => handleCategorySelection(category.id)}
                    color={
                      selectedCategoryIds.includes(category.id)
                        ? 'primary'
                        : 'default'
                    }
                    variant={
                      selectedCategoryIds.includes(category.id)
                        ? 'filled'
                        : 'outlined'
                    }
                    size="small"
                    sx={{
                      borderColor: category.color,
                      '&.MuiChip-colorPrimary': {
                        backgroundColor: category.color,
                        color: 'white',
                      },
                    }}
                  />
                ))}
              </Box>
              {selectedCategoryIds.length > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  {selectedCategoryIds.length}個のカテゴリが選択されています
                </Typography>
              )}
            </Box>
          )}

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

          {/* Success Message */}
          {success && (
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {onClose && (
              <Button onClick={onClose} disabled={isExporting}>
                キャンセル
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExport}
              disabled={
                isExporting ||
                (!options.includeTransactions && !options.includeCategories)
              }
            >
              {isExporting ? 'エクスポート中...' : 'エクスポート'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
export default DataExport;