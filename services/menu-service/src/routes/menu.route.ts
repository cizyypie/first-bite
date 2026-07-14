import { Elysia, t } from 'elysia';
import { MenuService } from '../services/menu.service';

const menuService = new MenuService();

export const menuRoutes = new Elysia({ prefix: '/api/menu' })
  // Get all items
  .get('/', async () => {
    return await menuService.getAllItems();
  })

  // Get items by category
  .get('/category/:categoryId', async ({ params }) => {
    return await menuService.getItemsByCategory(params.categoryId);
  })

  // Get single item
  .get('/:id', async ({ params, set }) => {
    try {
      return await menuService.getItemById(params.id);
    } catch (error: any) {
      set.status = 404;
      return { error: 'Item not found' };
    }
  })

  // Create item (admin)
  .post('/', async ({ body, set }) => {
    try {
      set.status = 201;
      return await menuService.createItem(body);
    } catch (error: any) {
      if (error.code === '23503') {
        set.status = 400;
        return { error: 'Invalid category ID' };
      }
      throw error;
    }
  }, {
    body: t.Object({
      categoryId: t.String(),
      name: t.String(),
      description: t.Optional(t.String()),
      price: t.Number(),
      isAvailable: t.Optional(t.Boolean()),
    })
  })

  // Update item (admin)
  .patch('/:id', async ({ params, body, set }) => {
    try {
      return await menuService.updateItem(params.id, body);
    } catch (error: any) {
      set.status = 404;
      return { error: 'Item not found' };
    }
  }, {
    body: t.Object({
      categoryId: t.Optional(t.String()),
      name: t.Optional(t.String()),
      description: t.Optional(t.String()),
      price: t.Optional(t.Number()),
      isAvailable: t.Optional(t.Boolean()),
    })
  })

  // Delete item (admin)
  .delete('/:id', async ({ params, set }) => {
    try {
      await menuService.deleteItem(params.id);
      return { message: 'Item deleted' };
    } catch (error: any) {
      set.status = 404;
      return { error: 'Item not found' };
    }
  });
