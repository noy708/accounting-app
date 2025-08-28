import { configureStore } from '@reduxjs/toolkit';
import transactionSlice from './slices/transactionSlice';
import categorySlice from './slices/categorySlice';
import errorSlice from './slices/errorSlice';
import progressSlice from './slices/progressSlice';
import { baseApi } from './api/baseApi';
import { rtkQueryErrorLogger, retryMiddleware } from './middleware/errorMiddleware';

export const store = configureStore({
  reducer: {
    transactions: transactionSlice,
    categories: categorySlice,
    errors: errorSlice,
    progress: progressSlice,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }).concat(baseApi.middleware, rtkQueryErrorLogger, retryMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
