import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { categories, items } from '../db/schema';

export class MenuService {
  // === Categories ===

  async getAllCategories() {
    return await db.select().from(categories);
  }

  async getCategoryById(id: string) {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    if (!category) throw new Error('CATEGORY_NOT_FOUND');
    return category;
  }

  async createCategory(data: { name: string; description?: string }) {
    const [newCategory] = await db
      .insert(categories)
      .values(data)
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, data: { name?: string; description?: string }) {
    const [updated] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    if (!updated) throw new Error('CATEGORY_NOT_FOUND');
    return updated;
  }

  async deleteCategory(id: string) {
    const [deleted] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    if (!deleted) throw new Error('CATEGORY_NOT_FOUND');
    return deleted;
  }

  // === Items ===

  async getAllItems() {
    return await db.select().from(items);
  }

  async getItemById(id: string) {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    if (!item) throw new Error('ITEM_NOT_FOUND');
    return item;
  }

  async getItemsByCategory(categoryId: string) {
    return await db.select().from(items).where(eq(items.categoryId, categoryId));
  }

  async createItem(data: {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    isAvailable?: boolean;
  }) {
    const [newItem] = await db
      .insert(items)
      .values(data)
      .returning();
    return newItem;
  }

  async updateItem(id: string, data: {
    categoryId?: string;
    name?: string;
    description?: string;
    price?: number;
    isAvailable?: boolean;
  }) {
    const [updated] = await db
      .update(items)
      .set(data)
      .where(eq(items.id, id))
      .returning();
    if (!updated) throw new Error('ITEM_NOT_FOUND');
    return updated;
  }

  async deleteItem(id: string) {
    const [deleted] = await db
      .delete(items)
      .where(eq(items.id, id))
      .returning();
    if (!deleted) throw new Error('ITEM_NOT_FOUND');
    return deleted;
  }
}
