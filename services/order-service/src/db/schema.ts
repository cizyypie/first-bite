import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  tableNumber: text('table_number').notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').default('PENDING').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  itemId: text('item_id').notNull(),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: integer('price_at_purchase').notNull(),
});