// Yearly report component with charts and year selection
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
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useGetYearlyReportQuery } from '../../store/api/reportApi';
import LoadingDisplay from '../common/LoadingDisplay';
import ErrorDisplay from '../common/ErrorDisplay';
import { YearSelector } from '../common/YearSelector';

// Chart.js の必要なコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface YearlyReportProps {
  className?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`yearly-report-tabpanel-${index}`}
      aria-labelledby={`yearly-report-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const YearlyReport: React.FC<YearlyReportProps> = ({ className }) => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [tabValue, setTabValue] = useState(0);

  const {
    data: report,
    isLoading,
    error,
    refetch,
  } = useGetYearlyReportQuery({
    year: selectedYear,
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 月別推移データの準備
  const prepareMonthlyTrendData = () => {
    if (!report) return null;

    const months = [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ];

    const incomeData = report.monthlyData.map((month) => month.totalIncome);
    const expenseData = report.monthlyData.map((month) => month.totalExpense);
    const balanceData = report.monthlyData.map((month) => month.balance);

    return {
      labels: months,
      datasets: [
        {
          label: '収入',
          data: incomeData,
          borderColor: theme.palette.success.main,
          backgroundColor: theme.palette.success.light,
          tension: 0.1,
        },
        {
          label: '支出',
          data: expenseData,
          borderColor: theme.palette.error.main,
          backgroundColor: theme.palette.error.light,
          tension: 0.1,
        },
        {
          label: '収支差額',
          data: balanceData,
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light,
          tension: 0.1,
        },
      ],
    };
  };

  // 月別収支棒グラフデータの準備
  const prepareMonthlyBarData = () => {
    if (!report) return null;

    const months = [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ];

    const incomeData = report.monthlyData.map((month) => month.totalIncome);
    const expenseData = report.monthlyData.map((month) => month.totalExpense);

    return {
      labels: months,
      datasets: [
        {
          label: '収入',
          data: incomeData,
          backgroundColor: theme.palette.success.main,
          borderColor: theme.palette.success.dark,
          borderWidth: 1,
        },
        {
          label: '支出',
          data: expenseData,
          backgroundColor: theme.palette.error.main,
          borderColor: theme.palette.error.dark,
          borderWidth: 1,
        },
      ],
    };
  };

  // チャートオプション
  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${selectedYear}年 月別推移`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = formatCurrency(context.parsed.y);
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(Number(value)),
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${selectedYear}年 月別収支`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = formatCurrency(context.parsed.y);
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(Number(value)),
        },
      },
    },
  };

  if (isLoading) {
    return (
      <LoadingDisplay loading={true} message="年次レポートを読み込み中..." />
    );
  }

  if (error) {
    const errorState = {
      message: '年次レポートの読み込みに失敗しました',
      type: 'database' as const,
      retryable: true,
    };
    return <ErrorDisplay error={errorState} onRetry={refetch} />;
  }

  const monthlyTrendData = prepareMonthlyTrendData();
  const monthlyBarData = prepareMonthlyBarData();

  return (
    <Box className={className}>
      <Typography variant="h4" component="h1" gutterBottom>
        年次レポート
      </Typography>

      {/* 年選択 */}
      <Box sx={{ mb: 3 }}>
        <YearSelector year={selectedYear} onYearChange={setSelectedYear} />
      </Box>

      {report && (
        <>
          {/* サマリーカード */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    年間総収入
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
                    年間総支出
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
                    年間収支差額
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
                    月平均収支
                  </Typography>
                  <Typography
                    variant="h5"
                    component="div"
                    color={report.balance >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(report.balance / 12)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* グラフ表示タブ */}
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="推移グラフ" />
                  <Tab label="月別比較" />
                  <Tab label="月別詳細" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                {monthlyTrendData && (
                  <Box sx={{ height: 400 }}>
                    <Line data={monthlyTrendData} options={lineChartOptions} />
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {monthlyBarData && (
                  <Box sx={{ height: 400 }}>
                    <Bar data={monthlyBarData} options={barChartOptions} />
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>月</TableCell>
                        <TableCell align="right">収入</TableCell>
                        <TableCell align="right">支出</TableCell>
                        <TableCell align="right">収支差額</TableCell>
                        <TableCell align="right">取引件数</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.monthlyData.map((monthData, index) => (
                        <TableRow key={monthData.month}>
                          <TableCell component="th" scope="row">
                            {monthData.month}月
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{ color: 'success.main' }}
                          >
                            {formatCurrency(monthData.totalIncome)}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            {formatCurrency(monthData.totalExpense)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color:
                                monthData.balance >= 0
                                  ? 'success.main'
                                  : 'error.main',
                            }}
                          >
                            {formatCurrency(monthData.balance)}
                          </TableCell>
                          <TableCell align="right">
                            {monthData.transactionCount}件
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </CardContent>
          </Card>
        </>
      )}

      {report &&
        report.monthlyData.every((month) => month.transactionCount === 0) && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                {selectedYear}年のデータがありません
              </Typography>
            </CardContent>
          </Card>
        )}
    </Box>
  );
};
