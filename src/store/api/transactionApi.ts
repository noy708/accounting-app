import { baseApi } from './baseApi';
import { transactionRepository } from '../../database/repositories/TransactionRepository';
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFilter,
} from '../../types';

export const transactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all transactions with optional filtering
    getTransactions: builder.query<Transaction[], TransactionFilter | void>({
      queryFn: async (filter) => {
        try {
          const transactions = await transactionRepository.getTransactions(
            filter || undefined
          );
          return { data: transactions };
        } catch (error: any) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error.message,
              data: error,
            },
          };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Transaction' as const, id })),
              { type: 'Transaction', id: 'LIST' },
              { type: 'TransactionStats', id: 'STATS' },
            ]
          : [{ type: 'Transaction', id: 'LIST' }],
    }),

    // Get transaction by ID
    getTransactionById: builder.query<Transaction, string>({
      queryFn: async (id) => {
        try {
          const transaction =
            await transactionRepository.getTransactionById(id);
          return { data: transaction };
        } catch (error: any) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error.message,
              data: error,
            },
          };
        }
      },
      providesTags: (result, error, id) => [{ type: 'Transaction', id }],
    }),

    // Create new transaction
    createTransaction: builder.mutation<Transaction, CreateTransactionDto>({
      queryFn: async (transactionDto) => {
        try {
          const transaction =
            await transactionRepository.createTransaction(transactionDto);
          return { data: transaction };
        } catch (error: any) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error.message,
              data: error,
            },
          };
        }
      },
      invalidatesTags: [
        { type: 'Transaction', id: 'LIST' },
        { type: 'TransactionStats', id: 'STATS' },
      ],
      // Optimistic update
      async onQueryStarted(transactionDto, { dispatch, queryFulfilled }) {
        // Create optimistic transaction
        const optimisticTransaction: Transaction = {
          id: `temp-${Date.now()}`,
          ...transactionDto,
          amount:
            transactionDto.type === 'expense'
              ? Math.abs(transactionDto.amount) * -1
              : Math.abs(transactionDto.amount),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Optimistically update the cache
        const patchResult = dispatch(
          transactionApi.util.updateQueryData(
            'getTransactions',
            undefined,
            (draft) => {
              draft.unshift(optimisticTransaction);
            }
          )
        );

        try {
          const { data: actualTransaction } = await queryFulfilled;
          // Replace optimistic transaction with actual one
          dispatch(
            transactionApi.util.updateQueryData(
              'getTransactions',
              undefined,
              (draft) => {
                const index = draft.findIndex(
                  (t) => t.id === optimisticTransaction.id
                );
                if (index !== -1) {
                  draft[index] = actualTransaction;
                }
              }
            )
          );
        } catch {
          // Revert optimistic update on error
          patchResult.undo();
        }
      },
    }),

    // Update transaction
    updateTransaction: builder.mutation<
      Transaction,
      { id: string; data: UpdateTransactionDto }
    >({
      queryFn: async ({ id, data }) => {
        try {
          const transaction = await transactionRepository.updateTransaction(
            id,
            data
          );
          return { data: transaction };
        } catch (error: any) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error.message,
              data: error,
            },
          };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Transaction', id },
        { type: 'Transaction', id: 'LIST' },
        { type: 'TransactionStats', id: 'STATS' },
      ],
      // Optimistic update
      async onQueryStarted(
        { id, data },
        { dispatch, queryFulfilled, getState }
      ) {
        // Get current transaction for optimistic update
        const currentTransaction =
          transactionApi.endpoints.getTransactionById.select(id)(
            getState() as any
          )?.data;

        if (currentTransaction) {
          const optimisticTransaction: Transaction = {
            ...currentTransaction,
            ...data,
            amount:
              data.type !== undefined || data.amount !== undefined
                ? (data.type || currentTransaction.type) === 'expense'
                  ? Math.abs(
                      data.amount ?? Math.abs(currentTransaction.amount)
                    ) * -1
                  : Math.abs(data.amount ?? Math.abs(currentTransaction.amount))
                : currentTransaction.amount,
            updatedAt: new Date(),
          };

          // Optimistically update the cache
          const patchResults = [
            dispatch(
              transactionApi.util.updateQueryData(
                'getTransactions',
                undefined,
                (draft) => {
                  const index = draft.findIndex((t) => t.id === id);
                  if (index !== -1) {
                    draft[index] = optimisticTransaction;
                  }
                }
              )
            ),
            dispatch(
              transactionApi.util.updateQueryData(
                'getTransactionById',
                id,
                () => optimisticTransaction
              )
            ),
          ];

          try {
            await queryFulfilled;
          } catch {
            // Revert optimistic updates on error
            patchResults.forEach((patch) => patch.undo());
          }
        }
      },
    }),

    // Delete transaction
    deleteTransaction: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          await transactionRepository.deleteTransaction(id);
          return { data: undefined };
        } catch (error: any) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error.message,
              data: error,
            },
          };
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: 'Transaction', id },
        { type: 'Transaction', id: 'LIST' },
        { type: 'TransactionStats', id: 'STATS' },
      ],
      // Optimistic update
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistically remove from cache
        const patchResult = dispatch(
          transactionApi.util.updateQueryData(
            'getTransactions',
            undefined,
            (draft) => {
              return draft.filter((t) => t.id !== id);
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          // Revert optimistic update on error
          patchResult.undo();
        }
      },
    }),

    // Get transaction statistics
    getTransactionStats: builder.query<
      {
        totalIncome: number;
        totalExpense: number;
        balance: number;
        count: number;
      },
      TransactionFilter | void
    >({
      queryFn: async (filter) => {
        try {
          const stats = await transactionRepository.getTransactionStats(
            filter || undefined
          );
          return { data: stats };
        } catch (error: any) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error.message,
              data: error,
            },
          };
        }
      },
      providesTags: [{ type: 'TransactionStats', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useGetTransactionByIdQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useGetTransactionStatsQuery,
  useLazyGetTransactionsQuery,
  useLazyGetTransactionByIdQuery,
} = transactionApi;
