import type { Config } from 'drizzle-kit';

export default {
  dialect: "sqlite",
  schema: './src/db/schema.ts',
  out: './src/migrations',
  dbCredentials: {
    url: "sqlite.db",
  },
  verbose: true,
  strict: true
} satisfies Config;