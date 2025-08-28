// Category repository implementation with CRUD operations, default categories, and constraint checking
import { db } from '../schema';
import { DatabaseError } from '../connection';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../types';
import { CategoryService } from '../../types/services';

export class CategoryRepository implements CategoryService {
  /**
   * 新しいカテゴリを作成
   */
  async createCategory(categoryDto: CreateCategoryDto): Promise<Category> {
    try {
      // バリデーション
      this.validateCategoryDto(categoryDto);

      // 同名カテゴリの重複チェック
      await this.validateCategoryNameUnique(categoryDto.name);

      const now = new Date();
      const category: Category = {
        id: crypto.randomUUID(),
        ...categoryDto,
        isDefault: false, // 手動作成のカテゴリはデフォルトではない
        createdAt: now,
        updatedAt: now,
      };

      await db.categories.add(category);
      return category;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Failed to create category:', error);
      throw new DatabaseError('カテゴリの作成に失敗しました', 'database', true);
    }
  }

  /**
   * カテゴリを更新
   */
  async updateCategory(
    id: string,
    updateDto: UpdateCategoryDto
  ): Promise<Category> {
    try {
      // 既存のカテゴリを取得
      const existingCategory = await this.getCategoryById(id);

      // 更新データのバリデーション
      this.validatePartialCategoryDto(updateDto);

      // 名前が変更される場合の重複チェック
      if (updateDto.name && updateDto.name !== existingCategory.name) {
        await this.validateCategoryNameUnique(updateDto.name);
      }

      // 更新データを準備
      const updatedData: Partial<Category> = {
        ...updateDto,
        updatedAt: new Date(),
      };

      await db.categories.update(id, updatedData);

      // 更新されたカテゴリを返す
      return await this.getCategoryById(id);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Failed to update category:', error);
      throw new DatabaseError('カテゴリの更新に失敗しました', 'database', true);
    }
  }

  /**
   * カテゴリを削除（制約チェック付き）
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      // カテゴリの存在確認
      const category = await this.getCategoryById(id);

      // 使用中カテゴリの削除制約チェック
      await this.validateCategoryNotInUse(id);

      // デフォルトカテゴリの削除制約チェック
      if (category.isDefault) {
        throw new DatabaseError(
          'デフォルトカテゴリは削除できません',
          'business'
        );
      }

      // Check if category exists before deletion
      const existingCategory = await db.categories.get(id);
      if (!existingCategory) {
        throw new DatabaseError('カテゴリが見つかりません', 'business');
      }

      await db.categories.delete(id);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Failed to delete category:', error);
      throw new DatabaseError('カテゴリの削除に失敗しました', 'database', true);
    }
  }

  /**
   * 全カテゴリを取得
   */
  async getCategories(): Promise<Category[]> {
    try {
      const categories = await db.categories.orderBy('name').toArray();

      return categories.map((c) => this.normalizeCategory(c));
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw new DatabaseError('カテゴリの取得に失敗しました', 'database', true);
    }
  }

  /**
   * IDでカテゴリを取得
   */
  async getCategoryById(id: string): Promise<Category> {
    try {
      const category = await db.categories.get(id);

      if (!category) {
        throw new DatabaseError('カテゴリが見つかりません', 'business');
      }

      return this.normalizeCategory(category);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Failed to get category by ID:', error);
      throw new DatabaseError('カテゴリの取得に失敗しました', 'database', true);
    }
  }

  /**
   * デフォルトカテゴリを作成
   */
  async createDefaultCategories(): Promise<void> {
    try {
      // 既存のデフォルトカテゴリをチェック
      const existingCategories = await db.categories
        .where('isDefault')
        .equals(1)
        .toArray();

      if (existingCategories.length > 0) {
        // 既にデフォルトカテゴリが存在する場合はスキップ
        return;
      }

      const defaultCategories: Omit<
        Category,
        'id' | 'createdAt' | 'updatedAt'
      >[] = [
        // 支出カテゴリ
        { name: '食費', color: '#FF6B6B', type: 'expense', isDefault: true },
        { name: '交通費', color: '#4ECDC4', type: 'expense', isDefault: true },
        { name: '光熱費', color: '#45B7D1', type: 'expense', isDefault: true },
        { name: '通信費', color: '#96CEB4', type: 'expense', isDefault: true },
        { name: '医療費', color: '#FFEAA7', type: 'expense', isDefault: true },
        { name: '娯楽費', color: '#DDA0DD', type: 'expense', isDefault: true },
        { name: '衣服費', color: '#98D8C8', type: 'expense', isDefault: true },
        { name: '日用品', color: '#F7DC6F', type: 'expense', isDefault: true },
        {
          name: 'その他支出',
          color: '#BDC3C7',
          type: 'expense',
          isDefault: true,
        },

        // 収入カテゴリ
        { name: '給与', color: '#2ECC71', type: 'income', isDefault: true },
        { name: '副業', color: '#27AE60', type: 'income', isDefault: true },
        { name: '投資', color: '#16A085', type: 'income', isDefault: true },
        {
          name: 'その他収入',
          color: '#1ABC9C',
          type: 'income',
          isDefault: true,
        },
      ];

      const now = new Date();
      const categoriesToCreate: Category[] = defaultCategories.map((cat) => ({
        ...cat,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }));

      await db.categories.bulkAdd(categoriesToCreate);

      console.log(`Created ${categoriesToCreate.length} default categories`);
    } catch (error) {
      console.error('Failed to create default categories:', error);
      throw new DatabaseError(
        'デフォルトカテゴリの作成に失敗しました',
        'database',
        true
      );
    }
  }

  /**
   * カテゴリが使用中かどうかをチェック
   */
  async isCategoryInUse(categoryId: string): Promise<boolean> {
    try {
      const transactionCount = await db.transactions
        .where('categoryId')
        .equals(categoryId)
        .count();

      return transactionCount > 0;
    } catch (error) {
      console.error('Failed to check category usage:', error);
      throw new DatabaseError(
        'カテゴリ使用状況の確認に失敗しました',
        'database',
        true
      );
    }
  }

  /**
   * タイプ別カテゴリを取得
   */
  async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    try {
      const categories = await db.categories
        .where('type')
        .anyOf([type, 'both'])
        .sortBy('name');

      return categories.map((c) => this.normalizeCategory(c));
    } catch (error) {
      console.error('Failed to get categories by type:', error);
      throw new DatabaseError('カテゴリの取得に失敗しました', 'database', true);
    }
  }

  /**
   * カテゴリデータの完全バリデーション
   */
  private validateCategoryDto(dto: CreateCategoryDto): void {
    const errors: string[] = [];

    // 必須フィールドのチェック
    if (!dto.name || dto.name.trim() === '') {
      errors.push('カテゴリ名は必須です');
    }

    if (!dto.color) {
      errors.push('カラーは必須です');
    }

    if (!dto.type) {
      errors.push('カテゴリタイプは必須です');
    }

    // カテゴリ名のバリデーション
    if (dto.name) {
      if (typeof dto.name !== 'string') {
        errors.push('カテゴリ名は文字列である必要があります');
      } else if (dto.name.trim().length > 50) {
        errors.push('カテゴリ名は50文字以内で入力してください');
      }
    }

    // カラーのバリデーション
    if (dto.color) {
      if (typeof dto.color !== 'string') {
        errors.push('カラーは文字列である必要があります');
      } else if (!/^#[0-9A-Fa-f]{6}$/.test(dto.color)) {
        errors.push('カラーは有効なHEX形式（#RRGGBB）で入力してください');
      }
    }

    // タイプのバリデーション
    if (dto.type && !['income', 'expense', 'both'].includes(dto.type)) {
      errors.push('カテゴリタイプは収入、支出、または両方である必要があります');
    }

    if (errors.length > 0) {
      throw new DatabaseError(
        `バリデーションエラー: ${errors.join(', ')}`,
        'validation'
      );
    }
  }

  /**
   * 部分更新用のバリデーション
   */
  private validatePartialCategoryDto(dto: UpdateCategoryDto): void {
    const errors: string[] = [];

    // カテゴリ名のバリデーション（提供された場合のみ）
    if (dto.name !== undefined) {
      if (!dto.name || dto.name.trim() === '') {
        errors.push('カテゴリ名は必須です');
      } else if (typeof dto.name !== 'string') {
        errors.push('カテゴリ名は文字列である必要があります');
      } else if (dto.name.trim().length > 50) {
        errors.push('カテゴリ名は50文字以内で入力してください');
      }
    }

    // カラーのバリデーション（提供された場合のみ）
    if (dto.color !== undefined) {
      if (!dto.color) {
        errors.push('カラーは必須です');
      } else if (typeof dto.color !== 'string') {
        errors.push('カラーは文字列である必要があります');
      } else if (!/^#[0-9A-Fa-f]{6}$/.test(dto.color)) {
        errors.push('カラーは有効なHEX形式（#RRGGBB）で入力してください');
      }
    }

    // タイプのバリデーション（提供された場合のみ）
    if (
      dto.type !== undefined &&
      !['income', 'expense', 'both'].includes(dto.type)
    ) {
      errors.push('カテゴリタイプは収入、支出、または両方である必要があります');
    }

    if (errors.length > 0) {
      throw new DatabaseError(
        `バリデーションエラー: ${errors.join(', ')}`,
        'validation'
      );
    }
  }

  /**
   * カテゴリ名の重複チェック
   */
  private async validateCategoryNameUnique(name: string): Promise<void> {
    try {
      const existingCategory = await db.categories
        .where('name')
        .equalsIgnoreCase(name.trim())
        .first();

      if (existingCategory) {
        throw new DatabaseError(
          '同じ名前のカテゴリが既に存在します',
          'business'
        );
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        'カテゴリ名の確認に失敗しました',
        'database',
        true
      );
    }
  }

  /**
   * カテゴリが使用中でないことを確認
   */
  private async validateCategoryNotInUse(categoryId: string): Promise<void> {
    try {
      const isInUse = await this.isCategoryInUse(categoryId);

      if (isInUse) {
        throw new DatabaseError(
          'このカテゴリは取引で使用されているため削除できません',
          'business'
        );
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        'カテゴリ使用状況の確認に失敗しました',
        'database',
        true
      );
    }
  }

  /**
   * カテゴリデータの正規化（日付をDateオブジェクトに変換）
   */
  private normalizeCategory(category: any): Category {
    return {
      ...category,
      createdAt: new Date(category.createdAt),
      updatedAt: new Date(category.updatedAt),
    };
  }
}

// シングルトンインスタンス
export const categoryRepository = new CategoryRepository();
