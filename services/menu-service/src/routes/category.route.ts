import { Elysia, t } from 'elysia';
import { MenuService } from '../services/menu.service';

const menuService = new MenuService();

export const categoryRoutes = new Elysia({ prefix: '/api/categories' })
  // Get all categories
  .get('/', async () => {
    return await menuService.getAllCategories();
  })

  // Get single category
  .get('/:id', async ({ params, set }) => {
    try {
      return await menuService.getCategoryById(params.id);
    } catch (error: any) {
      set.status = 404;
      return { error: 'Category not found' };
    }
  })

  // Create category (admin)
  .post('/', async ({ body, set }) => {
    try {
      set.status = 201;
      return await menuService.createCategory(body);
    } catch (error: any) {
      if (error.code === '23505') {
        set.status = 409;
        return { error: 'Category name already exists' };
      }
      throw error;
    }
  }, {
    body: t.Object({
      name: t.String(),
      description: t.Optional(t.String()),
    })
  })

  // Update category (admin)
  .patch('/:id', async ({ params, body, set }) => {
    try {
      return await menuService.updateCategory(params.id, body);
    } catch (error: any) {
      set.status = 404;
      return { error: 'Category not found' };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      description: t.Optional(t.String()),
    })
  })

  // Delete category (admin)
  .delete('/:id', async ({ params, set }) => {
    try {
      await menuService.deleteCategory(params.id);
      return { message: 'Category deleted' };
    } catch (error: any) {
      set.status = 404;
      return { error: 'Category not found' };
    }
  });
