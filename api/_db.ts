import { Pool } from 'pg';

// Use a lazy-initialized pool so missing envs fail at request time with a clearer message.
let pool: Pool | null = null;

const getConnectionString = () => {
  const connStr =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;

  if (!connStr) {
    throw new Error('DATABASE_URL environment variable is not set. Please configure it in Vercel dashboard.');
  }

  return connStr;
};

const getPool = () => {
  if (!pool) {
    const connectionString = getConnectionString();
    pool = new Pool({
      connectionString,
      max: 5,
    });
  }
  return pool;
};

export const query = (text: string, params?: unknown[]) => getPool().query(text, params);
