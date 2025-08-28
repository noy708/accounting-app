import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useGetCategoryReportQuery } from '../../store/api/reportApi';
import { CategorySummary } from '../../types';

// Chart.jsの必要なコンポーネントを登録
ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryReportProps {
  className?: string;
}

// 期間選択のオプション
const PERIOD_OPTIONS = [
  { value: 'current-month', label: '今月' },
  { value: 'last-month', label: '先月' },
  { value: 'last-3-months', label: '過去3ヶ月' },
  { value: 'last-6-months', label: '過去6ヶ月' },
  { value: 'current-year', label: '今年' },
] as const;

type PeriodOption = (typeof PERIOD_OPTIONS)[number]['value'];

export const CategoryReport: React.FC<CategoryReportProps> = ({
  className,
}) => {
  const [selectedPeriod, setSelectedPeriod] =
    useState<PeriodOption>('current-month');

  // 選択された期間に基づいて開始日と終了日を計算
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();

    switch (selectedPeriod) {
      case 'current-month':
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
        };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return {
          startDate: startOfMonth(lastMonth),
          endDate: endOfMonth(lastMonth),
        };
      case 'last-3-months':
        return {
          startDate: startOfMonth(subMonths(now, 2)),
          endDate: endOfMonth(now),
        };
      case 'last-6-months':
        return {
          startDate: startOfMonth(subMonths(now, 5)),
          endDate: endOfMonth(now),
        };
      case 'current-year':
        return {
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
        };
      default:
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
        };
    }
  }, [selectedPeriod]);

  // カテゴリレポートデータを取得
  const {
    data: categoryData,
    isLoading,
    error,
  } = useGetCategoryReportQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  // 期間選択の変更ハンドラ
  const handlePeriodChange = (event: SelectChangeEvent<PeriodOption>) => {
    setSelectedPeriod(event.target.value as PeriodOption);
  };

  // 円グラフのデータを生成
  const chartData = useMemo(() => {
    if (!categoryData || categoryData.length === 0) {
      return null;
    }

    // 上位10カテゴリのみ表示（その他は「その他」としてまとめる）
    const topCategories = categoryData.slice(0, 10);
    const otherCategories = categoryData.slice(10);

    const labels = topCategories.map((item) => item.categoryName);
    const data = topCategories.map((item) => item.amount);
    const colors = topCategories.map((_, index) => {
      // カテゴリごとに異なる色を生成
      const hue = (index * 360) / topCategories.length;
      return `hsl(${hue}, 70%, 60%)`;
    });

    // その他のカテゴリがある場合は追加
    if (otherCategories.length > 0) {
      const otherTotal = otherCategories.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      labels.push('その他');
      data.push(otherTotal);
      colors.push('#9e9e9e');
    }

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map((color) => color.replace('60%', '40%')),
          borderWidth: 2,
        },
      ],
    };
  }, [categoryData]);

  // 円グラフのオプション
  const chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (sum: number, val) => sum + (val as number),
              0
            );
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  // 総支出を計算
  const totalAmount = useMemo(() => {
    return categoryData?.reduce((sum, item) => sum + item.amount, 0) || 0;
  }, [categoryData]);

  // 金額をフォーマット
  const formatAmount = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  // 期間ラベルを取得
  const getPeriodLabel = () => {
    const option = PERIOD_OPTIONS.find((opt) => opt.value === selectedPeriod);
    return option?.label || '';
  };

  if (isLoading) {
    return (
      <Box className={className}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              カテゴリ別レポート
            </Typography>
            <Typography variant="body1">
              カテゴリレポートを読み込み中...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className={className}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="error" gutterBottom>
              エラー
            </Typography>
            <Typography variant="body1">
              カテゴリレポートの読み込みに失敗しました
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!categoryData || categoryData.length === 0) {
    return (
      <Box className={className}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              カテゴリ別レポート
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150, mb: 2 }}>
              <InputLabel>期間</InputLabel>
              <Select
                value={selectedPeriod}
                label="期間"
                onChange={handlePeriodChange}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body1" color="text.secondary">
              選択された期間にデータがありません
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box className={className}>
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h6">
              カテゴリ別レポート ({getPeriodLabel()})
            </Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>期間</InputLabel>
              <Select
                value={selectedPeriod}
                label="期間"
                onChange={handlePeriodChange}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            期間: {format(startDate, 'yyyy年M月d日')} ～{' '}
            {format(endDate, 'yyyy年M月d日')}
          </Typography>

          <Typography variant="h6" color="primary" gutterBottom>
            総支出: {formatAmount(totalAmount)}
          </Typography>

          <Grid container spacing={3}>
            {/* 円グラフ */}
            <Grid item xs={12} md={6}>
              <Box height={400}>
                {chartData && <Pie data={chartData} options={chartOptions} />}
              </Box>
            </Grid>

            {/* カテゴリ詳細テーブル */}
            <Grid item xs={12} md={6}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>カテゴリ</TableCell>
                      <TableCell align="right">金額</TableCell>
                      <TableCell align="right">割合</TableCell>
                      <TableCell align="right">取引数</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryData.map((category) => (
                      <TableRow key={category.categoryId}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box
                              width={12}
                              height={12}
                              borderRadius="50%"
                              bgcolor={`hsl(${(categoryData.indexOf(category) * 360) / Math.min(categoryData.length, 10)}, 70%, 60%)`}
                            />
                            {category.categoryName}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatAmount(category.amount)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${category.percentage.toFixed(1)}%`}
                            size="small"
                            color={
                              category.percentage >= 20
                                ? 'error'
                                : category.percentage >= 10
                                  ? 'warning'
                                  : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          {category.transactionCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
