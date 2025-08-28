// Monthly report component with month selection and summary display
import React, { useState } from 'react';
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
} from '@mui/material';
import { useGetMonthlyReportQuery } from '../../store/api/reportApi';
import LoadingDisplay from '../common/LoadingDisplay';
import ErrorDisplay from '../common/ErrorDisplay';
import { MonthSelector } from '../common/MonthSelector';

interface MonthlyReportProps {
  className?: string;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({ className }) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );

  const {
    data: report,
    isLoading,
    error,
    refetch,
  } = useGetMonthlyReportQuery({
    year: selectedYear,
    month: selectedMonth,
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    return `${percentage.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <LoadingDisplay loading={true} message="月次レポートを読み込み中..." />
    );
  }

  if (error) {
    const errorState = {
      message: '月次レポートの読み込みに失敗しました',
      type: 'database' as const,
      retryable: true,
    };
    return <ErrorDisplay error={errorState} onRetry={refetch} />;
  }

  return (
    <Box className={className}>
      <Typography variant="h4" component="h1" gutterBottom>
        月次レポート
      </Typography>

      {/* 月選択 */}
      <Box sx={{ mb: 3 }}>
        <MonthSelector
          year={selectedYear}
          month={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
        />
      </Box>

      {report && (
        <>
          {/* サマリーカード */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    総収入
                  </Typography>
                  <Typography variant="h5" component="div" color="success.main">
                    {formatCurrency(report.totalIncome)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    総支出
                  </Typography>
                  <Typography variant="h5" component="div" color="error.main">
                    {formatCurrency(report.totalExpense)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    収支差額
                  </Typography>
                  <Typography
                    variant="h5"
                    component="div"
                    color={report.balance >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(report.balance)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    取引件数
                  </Typography>
                  <Typography variant="h5" component="div">
                    {report.transactionCount}件
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* カテゴリ別内訳 */}
          {report.categoryBreakdown.length > 0 ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  カテゴリ別内訳
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>カテゴリ</TableCell>
                        <TableCell align="right">金額</TableCell>
                        <TableCell align="right">割合</TableCell>
                        <TableCell align="right">取引件数</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.categoryBreakdown.map((category) => (
                        <TableRow key={category.categoryId}>
                          <TableCell component="th" scope="row">
                            {category.categoryName}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(category.amount)}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatPercentage(category.percentage)}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {category.transactionCount}件
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  カテゴリ別内訳
                </Typography>
                <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                  {selectedYear}年{selectedMonth}月のデータがありません
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};
