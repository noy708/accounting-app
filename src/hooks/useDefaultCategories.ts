import { useEffect, useState } from 'react';
import { defaultCategoryService } from '../database/services/DefaultCategoryService';
import { useGetCategoriesQuery } from '../store/api/categoryApi';

/**
 * デフォルトカテゴリの初期化を管理するカスタムフック
 */
export const useDefaultCategories = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  useEffect(() => {
    const initializeCategories = async () => {
      // Skip if already initializing or if categories are still loading
      if (isInitializing || isCategoriesLoading) {
        return;
      }

      // Skip if already initialized
      if (defaultCategoryService.isDefaultCategoriesInitialized()) {
        return;
      }

      try {
        setIsInitializing(true);
        setInitializationError(null);

        await defaultCategoryService.initializeDefaultCategories();

        // Refetch categories to update the UI
        await refetchCategories();
      } catch (error: any) {
        console.error('Failed to initialize default categories:', error);
        setInitializationError(
          error.message || 'デフォルトカテゴリの初期化に失敗しました'
        );
      } finally {
        setIsInitializing(false);
      }
    };

    initializeCategories();
  }, [isCategoriesLoading, isInitializing, refetchCategories]);

  const forceCreateDefaults = async () => {
    try {
      setIsInitializing(true);
      setInitializationError(null);

      await defaultCategoryService.forceCreateDefaultCategories();
      await refetchCategories();
    } catch (error: any) {
      console.error('Failed to force create default categories:', error);
      setInitializationError(
        error.message || 'デフォルトカテゴリの作成に失敗しました'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const getDefaultTemplates = () => {
    return defaultCategoryService.getDefaultCategoryTemplates();
  };

  return {
    categories,
    isInitializing,
    initializationError,
    isCategoriesLoading,
    forceCreateDefaults,
    getDefaultTemplates,
    isInitialized: defaultCategoryService.isDefaultCategoriesInitialized(),
  };
};
