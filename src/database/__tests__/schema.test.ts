// Simple schema test to debug the issue
import { db } from '../schema';
import 'fake-indexeddb/auto';

describe('Database Schema', () => {
  beforeEach(async () => {
    try {
      await db.delete();
    } catch (error) {
      // Database doesn't exist, ignore
    }
  });

  afterEach(async () => {
    try {
      await db.close();
    } catch (error) {
      // Already closed, ignore
    }
  });

  it('should create a simple category', async () => {
    await db.open();
    
    const category = {
      id: 'test-id',
      name: 'Test Category',
      color: '#FF0000',
      type: 'expense' as const,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.categories.add(category);
    
    const retrieved = await db.categories.get('test-id');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Test Category');
  });

  it('should create multiple categories', async () => {
    await db.open();
    
    const categories = [
      {
        id: 'test-1',
        name: 'Category 1',
        color: '#FF0000',
        type: 'expense' as const,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'test-2',
        name: 'Category 2',
        color: '#00FF00',
        type: 'income' as const,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await db.categories.bulkAdd(categories);
    
    const count = await db.categories.count();
    expect(count).toBe(2);
    
    const allCategories = await db.categories.toArray();
    const defaultCategories = allCategories.filter(cat => cat.isDefault);
    expect(defaultCategories).toHaveLength(1);
    expect(defaultCategories[0].name).toBe('Category 2');
  });
});