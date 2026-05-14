import { neon } from "@neondatabase/serverless";

// Singleton pattern for Neon client
let sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

export { sql };
