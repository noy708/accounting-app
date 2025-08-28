// RTK Query API slice for report operations
import { MonthlyReport, CategorySummary, YearlyReport } from '../../types';
import { reportService } from '../../database/services/ReportService';
import { baseApi } from './baseApi';

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 月次レポート取得
    getMonthlyReport: builder.query<MonthlyReport, { year: number; month: number }>({
      queryFn: async ({ year, month }) => {
        try {
          const report = await reportService.getMonthlyReport(year, month);
          return { data: report };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            } 
          };
        }
      },
      providesTags: (result, error, { year, month }) => [
        { type: 'MonthlyReport', id: `${year}-${month}` },
      ],
    }),

    // カテゴリ別レポート取得
    getCategoryReport: builder.query<CategorySummary[], { startDate: string; endDate: string }>({
      queryFn: async ({ startDate, endDate }) => {
        try {
          const report = await reportService.getCategoryReport(
            new Date(startDate),
            new Date(endDate)
          );
          return { data: report };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            } 
          };
        }
      },
      providesTags: (result, error, { startDate, endDate }) => [
        { type: 'CategoryReport', id: `${startDate}-${endDate}` },
      ],
    }),

    // 年次レポート取得
    getYearlyReport: builder.query<YearlyReport, { year: number }>({
      queryFn: async ({ year }) => {
        try {
          const report = await reportService.getYearlyReport(year);
          return { data: report };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            } 
          };
        }
      },
      providesTags: (result, error, { year }) => [
        { type: 'YearlyReport', id: year },
      ],
    }),

    // 日別統計取得（グラフ表示用）
    getDailyStats: builder.query<Array<{
      date: string;
      income: number;
      expense: number;
      balance: number;
    }>, { startDate: string; endDate: string }>({
      queryFn: async ({ startDate, endDate }) => {
        try {
          const stats = await reportService.getDailyStats(
            new Date(startDate),
            new Date(endDate)
          );
          return { data: stats };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            } 
          };
        }
      },
      providesTags: (result, error, { startDate, endDate }) => [
        { type: 'CategoryReport', id: `daily-${startDate}-${endDate}` },
      ],
    }),
  }),
});

export const {
  useGetMonthlyReportQuery,
  useGetCategoryReportQuery,
  useGetYearlyReportQuery,
  useGetDailyStatsQuery,
} = reportApi;