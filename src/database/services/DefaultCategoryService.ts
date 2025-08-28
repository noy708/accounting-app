import { categoryRepository } from '../repositories/CategoryRepository';
import { DatabaseError } from '../connection';

/**
 * デフォルトカテゴリの自動作成サービス
 * アプリケーション初回起動時にデフォルトカテゴリを作成する
 */
export class DefaultCategoryService {
  private static instance: DefaultCategoryService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DefaultCategoryService {
    if (!DefaultCategoryService.instance) {
      DefaultCategoryService.instance = new DefaultCategoryService();
    }
    return DefaultCategoryService.instance;
  }

  /**
   * アプリケーション初期化時にデフォルトカテゴリを作成
   * 既にカテゴリが存在する場合はスキップ
   */
  async initializeDefaultCategories(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Checking for default categories...');

      // 既存のカテゴリをチェック
      const existingCategories = await categoryRepository.getCategories();

      if (existingCategories.length > 0) {
        console.log(
          `Found ${existingCategories.length} existing categories, skipping default creation`
        );
        this.isInitialized = true;
        return;
      }

      console.log('No categories found, creating default categories...');
      await categoryRepository.createDefaultCategories();

      const createdCategories = await categoryRepository.getCategories();
      console.log(
        `Successfully created ${createdCategories.length} default categories`
      );

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize default categories:', error);
      // Don't throw error to prevent app from crashing
      // The user can manually create categories if needed
    }
  }

  /**
   * デフォルトカテゴリを強制的に再作成
   * 既存のカテゴリがある場合でも作成する（テスト用）
   */
  async forceCreateDefaultCategories(): Promise<void> {
    try {
      console.log('Force creating default categories...');
      await categoryRepository.createDefaultCategories();

      const categories = await categoryRepository.getCategories();
      console.log(
        `Force created default categories, total: ${categories.length}`
      );
    } catch (error) {
      console.error('Failed to force create default categories:', error);
      throw new DatabaseError(
        'デフォルトカテゴリの強制作成に失敗しました',
        'database',
        true
      );
    }
  }

  /**
   * デフォルトカテゴリのテンプレートを取得
   * UI表示用
   */
  getDefaultCategoryTemplates() {
    return {
      expense: [
        { name: '食費', color: '#FF6B6B', description: '食事、食材、外食など' },
        {
          name: '交通費',
          color: '#4ECDC4',
          description: '電車、バス、タクシー、ガソリンなど',
        },
        {
          name: '光熱費',
          color: '#45B7D1',
          description: '電気、ガス、水道など',
        },
        {
          name: '通信費',
          color: '#96CEB4',
          description: '携帯電話、インターネット、郵送料など',
        },
        {
          name: '医療費',
          color: '#FFEAA7',
          description: '病院、薬局、健康関連など',
        },
        {
          name: '娯楽費',
          color: '#DDA0DD',
          description: '映画、ゲーム、趣味など',
        },
        {
          name: '衣服費',
          color: '#98D8C8',
          description: '洋服、靴、アクセサリーなど',
        },
        {
          name: '日用品',
          color: '#F7DC6F',
          description: '洗剤、ティッシュ、文房具など',
        },
        { name: 'その他支出', color: '#BDC3C7', description: 'その他の支出' },
      ],
      income: [
        {
          name: '給与',
          color: '#2ECC71',
          description: '会社からの給与、賞与など',
        },
        {
          name: '副業',
          color: '#27AE60',
          description: 'アルバイト、フリーランス収入など',
        },
        {
          name: '投資',
          color: '#16A085',
          description: '株式、投資信託、配当など',
        },
        { name: 'その他収入', color: '#1ABC9C', description: 'その他の収入' },
      ],
    };
  }

  /**
   * 初期化状態をリセット（テスト用）
   */
  resetInitializationState(): void {
    this.isInitialized = false;
  }

  /**
   * 初期化済みかどうかを確認
   */
  isDefaultCategoriesInitialized(): boolean {
    return this.isInitialized;
  }
}

// シングルトンインスタンス
export const defaultCategoryService = DefaultCategoryService.getInstance();
