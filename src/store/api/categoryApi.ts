import { baseApi } from './baseApi';
import { categoryRepository } from '../../database/repositories/CategoryRepository';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../types';

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all categories
    getCategories: builder.query<Category[], void>({
      queryFn: async () => {
        try {
          const categories = await categoryRepository.getCategories();
          return { data: categories };
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
              ...result.map(({ id }) => ({ type: 'Category' as const, id })),
              { type: 'Category', id: 'LIST' },
            ]
          : [{ type: 'Category', id: 'LIST' }],
    }),

    // Get category by ID
    getCategoryById: builder.query<Category, string>({
      queryFn: async (id) => {
        try {
          const category = await categoryRepository.getCategoryById(id);
          return { data: category };
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
      providesTags: (result, error, id) => [{ type: 'Category', id }],
    }),

    // Get categories by type
    getCategoriesByType: builder.query<Category[], 'income' | 'expense'>({
      queryFn: async (type) => {
        try {
          const categories = await categoryRepository.getCategoriesByType(type);
          return { data: categories };
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
      providesTags: (result, error, type) => [
        { type: 'Category', id: `TYPE_${type}` },
        { type: 'Category', id: 'LIST' },
      ],
    }),

    // Create new category
    createCategory: builder.mutation<Category, CreateCategoryDto>({
      queryFn: async (categoryDto) => {
        try {
          const category = await categoryRepository.createCategory(categoryDto);
          return { data: category };
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
        { type: 'Category', id: 'LIST' },
        { type: 'Category', id: 'TYPE_income' },
        { type: 'Category', id: 'TYPE_expense' },
      ],
      // Optimistic update
      async onQueryStarted(categoryDto, { dispatch, queryFulfilled }) {
        // Create optimistic category
        const optimisticCategory: Category = {
          id: `temp-${Date.now()}`,
          ...categoryDto,
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Optimistically update the cache
        const patchResult = dispatch(
          categoryApi.util.updateQueryData(
            'getCategories',
            undefined,
            (draft) => {
              draft.push(optimisticCategory);
              // Sort by name to maintain order
              draft.sort((a, b) => a.name.localeCompare(b.name));
            }
          )
        );

        try {
          const { data: actualCategory } = await queryFulfilled;
          // Replace optimistic category with actual one
          dispatch(
            categoryApi.util.updateQueryData(
              'getCategories',
              undefined,
              (draft) => {
                const index = draft.findIndex(
                  (c) => c.id === optimisticCategory.id
                );
                if (index !== -1) {
                  draft[index] = actualCategory;
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

    // Update category
    updateCategory: builder.mutation<
      Category,
      { id: string; data: UpdateCategoryDto }
    >({
      queryFn: async ({ id, data }) => {
        try {
          const category = await categoryRepository.updateCategory(id, data);
          return { data: category };
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
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
        { type: 'Category', id: 'TYPE_income' },
        { type: 'Category', id: 'TYPE_expense' },
      ],
      // Optimistic update
      async onQueryStarted(
        { id, data },
        { dispatch, queryFulfilled, getState }
      ) {
        // Get current category for optimistic update
        const currentCategory = categoryApi.endpoints.getCategoryById.select(
          id
        )(getState() as any)?.data;

        if (currentCategory) {
          const optimisticCategory: Category = {
            ...currentCategory,
            ...data,
            updatedAt: new Date(),
          };

          // Optimistically update the cache
          const patchResults = [
            dispatch(
              categoryApi.util.updateQueryData(
                'getCategories',
                undefined,
                (draft) => {
                  const index = draft.findIndex((c) => c.id === id);
                  if (index !== -1) {
                    draft[index] = optimisticCategory;
                    // Re-sort if name changed
                    if (data.name) {
                      draft.sort((a, b) => a.name.localeCompare(b.name));
                    }
                  }
                }
              )
            ),
            dispatch(
              categoryApi.util.updateQueryData(
                'getCategoryById',
                id,
                () => optimisticCategory
              )
            ),
          ];

          // Update type-specific caches if type changed
          if (data.type) {
            ['income', 'expense'].forEach((type) => {
              const typeQuery = type as 'income' | 'expense';
              patchResults.push(
                dispatch(
                  categoryApi.util.updateQueryData(
                    'getCategoriesByType',
                    typeQuery,
                    (draft) => {
                      const shouldInclude =
                        optimisticCategory.type === typeQuery ||
                        optimisticCategory.type === 'both';
                      const currentIndex = draft.findIndex((c) => c.id === id);

                      if (shouldInclude && currentIndex === -1) {
                        draft.push(optimisticCategory);
                        draft.sort((a, b) => a.name.localeCompare(b.name));
                      } else if (!shouldInclude && currentIndex !== -1) {
                        draft.splice(currentIndex, 1);
                      } else if (shouldInclude && currentIndex !== -1) {
                        draft[currentIndex] = optimisticCategory;
                        draft.sort((a, b) => a.name.localeCompare(b.name));
                      }
                    }
                  )
                )
              );
            });
          }

          try {
            await queryFulfilled;
          } catch {
            // Revert optimistic updates on error
            patchResults.forEach((patch) => patch.undo());
          }
        }
      },
    }),

    // Delete category
    deleteCategory: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          await categoryRepository.deleteCategory(id);
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
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
        { type: 'Category', id: 'TYPE_income' },
        { type: 'Category', id: 'TYPE_expense' },
      ],
      // Optimistic update
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        // Optimistically remove from cache
        const patchResults = [
          dispatch(
            categoryApi.util.updateQueryData(
              'getCategories',
              undefined,
              (draft) => {
                return draft.filter((c) => c.id !== id);
              }
            )
          ),
          dispatch(
            categoryApi.util.updateQueryData(
              'getCategoriesByType',
              'income',
              (draft) => {
                return draft.filter((c) => c.id !== id);
              }
            )
          ),
          dispatch(
            categoryApi.util.updateQueryData(
              'getCategoriesByType',
              'expense',
              (draft) => {
                return draft.filter((c) => c.id !== id);
              }
            )
          ),
        ];

        try {
          await queryFulfilled;
        } catch {
          // Revert optimistic updates on error
          patchResults.forEach((patch) => patch.undo());
        }
      },
    }),

    // Check if category is in use
    isCategoryInUse: builder.query<boolean, string>({
      queryFn: async (categoryId) => {
        try {
          const isInUse = await categoryRepository.isCategoryInUse(categoryId);
          return { data: isInUse };
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
      providesTags: (result, error, categoryId) => [
        { type: 'Category', id: `USAGE_${categoryId}` },
      ],
    }),

    // Create default categories
    createDefaultCategories: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          await categoryRepository.createDefaultCategories();
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
      invalidatesTags: [
        { type: 'Category', id: 'LIST' },
        { type: 'Category', id: 'TYPE_income' },
        { type: 'Category', id: 'TYPE_expense' },
      ],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useGetCategoriesByTypeQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useIsCategoryInUseQuery,
  useCreateDefaultCategoriesMutation,
  useLazyGetCategoriesQuery,
  useLazyGetCategoryByIdQuery,
  useLazyGetCategoriesByTypeQuery,
  useLazyIsCategoryInUseQuery,
} = categoryApi;
