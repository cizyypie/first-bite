import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;
export const db = drizzle(postgres(connectionString, {
  max: 1,
  connect_timeout: 30,
}));
