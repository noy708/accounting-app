import { Transaction, Category, CreateTransactionDto, CreateCategoryDto } from '../../types';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';

export interface ImportOptions {
  skipDuplicates: boolean;
  updateExisting: boolean;
  createMissingCategories: boolean;
}

export interface ImportProgress {
  current: number;
  total: number;
  stage: 'parsing' | 'validating' | 'importing' | 'complete';
  message: string;
}

export interface ImportResult {
  transactions: {
    imported: number;
    skipped: number;
    errors: number;
  };
  categories: {
    imported: number;
    skipped: number;
    errors: number;
  };
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ParsedTransactionData {
  date: string;
  amount: string;
  type: string;
  category: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParsedCategoryData {
  name: string;
  color: string;
  type: string;
  isDefault: string;
  createdAt?: string;
  updatedAt?: string;
}

export class DataImportService {
  private transactionRepo: TransactionRepository;
  private categoryRepo: CategoryRepository;

  constructor() {
    this.transactionRepo = new TransactionRepository();
    this.categoryRepo = new CategoryRepository();
  }

  async importFromCSV(
    transactionsCsv?: string,
    categoriesCsv?: string,
    options: ImportOptions = {
      skipDuplicates: true,
      updateExisting: false,
      createMissingCategories: true
    },
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      transactions: { imported: 0, skipped: 0, errors: 0 },
      categories: { imported: 0, skipped: 0, errors: 0 },
      errors: []
    };

    let totalSteps = 0;
    let currentStep = 0;

    // Calculate total steps
    if (categoriesCsv) totalSteps++;
    if (transactionsCsv) totalSteps++;

    onProgress?.({
      current: 0,
      total: totalSteps,
      stage: 'parsing',
      message: 'データを解析中...'
    });

    try {
      // Import categories first if provided
      if (categoriesCsv) {
        onProgress?.({
          current: currentStep,
          total: totalSteps,
          stage: 'importing',
          message: 'カテゴリをインポート中...'
        });

        const categoryResult = await this.importCategories(categoriesCsv, options, onProgress);
        result.categories = categoryResult.categories;
        result.errors.push(...categoryResult.errors);
        currentStep++;
      }

      // Import transactions if provided
      if (transactionsCsv) {
        onProgress?.({
          current: currentStep,
          total: totalSteps,
          stage: 'importing',
          message: '取引をインポート中...'
        });

        const transactionResult = await this.importTransactions(transactionsCsv, options, onProgress);
        result.transactions = transactionResult.transactions;
        result.errors.push(...transactionResult.errors);
        currentStep++;
      }

      onProgress?.({
        current: totalSteps,
        total: totalSteps,
        stage: 'complete',
        message: 'インポート完了'
      });

      return result;
    } catch (error) {
      throw new Error(`インポートに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async importCategories(
    csv: string,
    options: ImportOptions,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<Pick<ImportResult, 'categories' | 'errors'>> {
    const result = {
      categories: { imported: 0, skipped: 0, errors: 0 },
      errors: [] as ImportError[]
    };

    try {
      const parsedData = this.parseCSV<ParsedCategoryData>(csv);
      const existingCategories = await this.categoryRepo.getAll();
      const existingCategoryNames = new Set(existingCategories.map(c => c.name.toLowerCase()));

      for (let i = 0; i < parsedData.length; i++) {
        const rowData = parsedData[i];
        const rowNumber = i + 2; // +2 because of header row and 0-based index

        try {
          const validationResult = this.validateCategoryData(rowData, rowNumber);
          if (!validationResult.isValid) {
            result.errors.push(...validationResult.errors);
            result.categories.errors++;
            continue;
          }

          const categoryData = validationResult.data!;

          // Check for duplicates
          if (existingCategoryNames.has(categoryData.name.toLowerCase())) {
            if (options.skipDuplicates) {
              result.categories.skipped++;
              continue;
            } else if (options.updateExisting) {
              // Find existing category and update
              const existingCategory = existingCategories.find(
                c => c.name.toLowerCase() === categoryData.name.toLowerCase()
              );
              if (existingCategory) {
                await this.categoryRepo.update(existingCategory.id, {
                  color: categoryData.color,
                  type: categoryData.type
                });
                result.categories.imported++;
                continue;
              }
            }
          }

          // Create new category
          await this.categoryRepo.create(categoryData);
          existingCategoryNames.add(categoryData.name.toLowerCase());
          result.categories.imported++;

        } catch (error) {
          result.errors.push({
            row: rowNumber,
            message: `カテゴリの処理中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
            data: rowData
          });
          result.categories.errors++;
        }
      }
    } catch (error) {
      result.errors.push({
        row: 0,
        message: `カテゴリCSVの解析に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return result;
  }

  private async importTransactions(
    csv: string,
    options: ImportOptions,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<Pick<ImportResult, 'transactions' | 'errors'>> {
    const result = {
      transactions: { imported: 0, skipped: 0, errors: 0 },
      errors: [] as ImportError[]
    };

    try {
      const parsedData = this.parseCSV<ParsedTransactionData>(csv);
      const existingCategories = await this.categoryRepo.getAll();
      const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));
      const existingTransactions = await this.transactionRepo.getTransactions({});

      for (let i = 0; i < parsedData.length; i++) {
        const rowData = parsedData[i];
        const rowNumber = i + 2; // +2 because of header row and 0-based index

        try {
          const validationResult = this.validateTransactionData(rowData, rowNumber, categoryMap, options);
          if (!validationResult.isValid) {
            result.errors.push(...validationResult.errors);
            result.transactions.errors++;
            continue;
          }

          const transactionData = validationResult.data!;

          // Check for duplicates (same date, amount, description, and category)
          const isDuplicate = existingTransactions.some(t => 
            t.date && transactionData.date &&
            t.date.toDateString() === transactionData.date.toDateString() &&
            t.amount === transactionData.amount &&
            t.description === transactionData.description &&
            t.categoryId === transactionData.categoryId
          );

          if (isDuplicate && options.skipDuplicates) {
            result.transactions.skipped++;
            continue;
          }

          // Create new transaction
          const newTransaction = await this.transactionRepo.create(transactionData);
          existingTransactions.push(newTransaction);
          result.transactions.imported++;

        } catch (error) {
          result.errors.push({
            row: rowNumber,
            message: `取引の処理中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
            data: rowData
          });
          result.transactions.errors++;
        }
      }
    } catch (error) {
      result.errors.push({
        row: 0,
        message: `取引CSVの解析に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return result;
  }

  private parseCSV<T>(csv: string): T[] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSVファイルにデータが含まれていません');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data: T[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        throw new Error(`行 ${i + 1}: 列数が一致しません (期待: ${headers.length}, 実際: ${values.length})`);
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[this.mapHeaderToField(header)] = values[index];
      });
      data.push(row);
    }

    return data;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current.trim());
    return result;
  }

  private mapHeaderToField(header: string): string {
    const headerMap: { [key: string]: string } = {
      '日付': 'date',
      '金額': 'amount',
      '種類': 'type',
      'カテゴリ': 'category',
      '説明': 'description',
      '作成日時': 'createdAt',
      '更新日時': 'updatedAt',
      'カテゴリ名': 'name',
      '色': 'color',
      'デフォルト': 'isDefault'
    };

    return headerMap[header] || header.toLowerCase();
  }

  private validateCategoryData(
    data: ParsedCategoryData,
    rowNumber: number
  ): { isValid: boolean; data?: CreateCategoryDto; errors: ImportError[] } {
    const errors: ImportError[] = [];

    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'name',
        message: 'カテゴリ名は必須です'
      });
    }

    if (!data.color || data.color.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'color',
        message: '色は必須です'
      });
    }

    if (!data.type || !['収入', '支出', '両方'].includes(data.type)) {
      errors.push({
        row: rowNumber,
        field: 'type',
        message: '種類は「収入」「支出」「両方」のいずれかである必要があります'
      });
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Map type
    let type: 'income' | 'expense' | 'both';
    switch (data.type) {
      case '収入':
        type = 'income';
        break;
      case '支出':
        type = 'expense';
        break;
      case '両方':
        type = 'both';
        break;
      default:
        type = 'both';
    }

    return {
      isValid: true,
      data: {
        name: data.name.trim(),
        color: data.color.trim(),
        type
      },
      errors: []
    };
  }

  private validateTransactionData(
    data: ParsedTransactionData,
    rowNumber: number,
    categoryMap: Map<string, string>,
    options: ImportOptions
  ): { isValid: boolean; data?: CreateTransactionDto; errors: ImportError[] } {
    const errors: ImportError[] = [];

    // Validate date
    let date: Date;
    try {
      // Try parsing Japanese date format first
      const dateStr = data.date.trim();
      if (dateStr.match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
        const [year, month, day] = dateStr.split('/').map(Number);
        // Use UTC to avoid timezone issues in tests
        date = new Date(Date.UTC(year, month - 1, day));
      } else {
        date = new Date(dateStr);
      }
      
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
    } catch {
      errors.push({
        row: rowNumber,
        field: 'date',
        message: '日付の形式が正しくありません (YYYY/MM/DD形式で入力してください)'
      });
      date = new Date(); // Set a default to avoid undefined
    }

    // Validate amount
    let amount: number;
    try {
      amount = parseFloat(data.amount.replace(/,/g, ''));
      if (isNaN(amount)) {
        throw new Error('Invalid amount');
      }
    } catch {
      errors.push({
        row: rowNumber,
        field: 'amount',
        message: '金額は数値である必要があります'
      });
      amount = 0; // Set a default to avoid undefined
    }

    // Validate type
    if (!data.type || !['収入', '支出'].includes(data.type)) {
      errors.push({
        row: rowNumber,
        field: 'type',
        message: '種類は「収入」または「支出」である必要があります'
      });
    }

    // Validate category
    let categoryId: string = '';
    if (!data.category || data.category.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'category',
        message: 'カテゴリは必須です'
      });
    } else {
      const categoryName = data.category.trim().toLowerCase();
      categoryId = categoryMap.get(categoryName) || '';
      
      if (!categoryId) {
        if (options.createMissingCategories) {
          // This would need to be handled at a higher level
          errors.push({
            row: rowNumber,
            field: 'category',
            message: `カテゴリ「${data.category}」が見つかりません。先にカテゴリをインポートしてください。`
          });
        } else {
          errors.push({
            row: rowNumber,
            field: 'category',
            message: `カテゴリ「${data.category}」が見つかりません`
          });
        }
      }
    }

    // Validate description
    if (!data.description || data.description.trim() === '') {
      errors.push({
        row: rowNumber,
        field: 'description',
        message: '説明は必須です'
      });
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Map type
    const type: 'income' | 'expense' = data.type === '収入' ? 'income' : 'expense';

    // Ensure amount sign matches type
    if (type === 'income' && amount! < 0) {
      amount! = Math.abs(amount!);
    } else if (type === 'expense' && amount! > 0) {
      amount! = -Math.abs(amount!);
    }

    return {
      isValid: true,
      data: {
        date: date!,
        amount: amount!,
        description: data.description.trim(),
        categoryId: categoryId!,
        type
      },
      errors: []
    };
  }
}