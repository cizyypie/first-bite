import { pgTable, text, timestamp, decimal } from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(), 
  provider: text("provider").notNull(),
  providerId: text("provider_id").notNull(), 
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), 
  createdAt: timestamp("created_at").defaultNow(),
});