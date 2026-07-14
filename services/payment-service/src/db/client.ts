import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const queryClient = postgres(process.env.DATABASE_URL!, { connect_timeout: 30 });
export const db = drizzle(queryClient);