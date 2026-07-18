// server/src/config/db.ts - Configuração do PostgreSQL

import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'boleia_angola',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  options: '-c search_path=public'
});

// Wrapper simplificado para query
export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool
};

export default db;