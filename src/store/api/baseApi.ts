import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

// Base API configuration for RTK Query
// Using fakeBaseQuery since we're working with IndexedDB directly through repositories
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    'Transaction',
    'Category',
    'TransactionStats',
    'MonthlyReport',
    'CategoryReport',
    'YearlyReport',
  ],
  endpoints: () => ({}),
});

export default baseApi;
