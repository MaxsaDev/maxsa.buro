import { loadEnvConfig } from '@next/env';
import { Pool } from 'pg';

// Завантажуємо змінні оточення Next.js (включаючи .env.local)
// Це гарантує, що всі env змінні доступні до ініціалізації Better Auth
const projectDir = process.cwd();
loadEnvConfig(projectDir);

export const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER || 'neondb_owner',
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: true,
  },
  max: 20, // Максимум з'єднань в пулі
  idleTimeoutMillis: 60000, // 60 сек - час життя idle з'єднання
  connectionTimeoutMillis: 10000, // 10 сек - таймаут підключення (було 2 сек - занадто мало!)
  query_timeout: 30000, // 30 сек - таймаут на запит
});
