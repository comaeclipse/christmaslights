import { Pool } from 'pg';

// Use a lazy-initialized pool so missing envs fail at request time with a clearer message.
let pool: Pool | null = null;

const getConnectionString = () =>
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  // Fallback to provided Neon URL to avoid missing-env crashes on prod.
  'postgresql://neondb_owner:npg_jozx54TPdyqW@ep-flat-math-adtwmntl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const getPool = () => {
  if (!pool) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    pool = new Pool({
      connectionString,
      max: 5,
    });
  }
  return pool;
};

export const query = (text: string, params?: unknown[]) => getPool().query(text, params);
