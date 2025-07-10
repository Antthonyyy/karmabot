import * as dotenv from "dotenv";
dotenv.config();

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";



if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use Supabase URL with port 5432 for direct connection
const supabaseUrl = 'postgresql://postgres.babyubgvqronpuezmmrb:Uybkjcbhfynjy1997@aws-0-eu-north-1.pooler.supabase.com:5432/postgres';
const databaseUrl = supabaseUrl;

console.log('📝 Using Supabase database with pg:', databaseUrl.substring(0, 50) + '...');

// Create connection pool with proper configuration for Supabase
export const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });

// Test database connection
export async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const result = await db.select({ id: schema.users.id }).from(schema.users).limit(1);
    console.log('✅ Database connection successful');
    console.log(`📊 Found ${result.length} users in database`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔌 Closing database connections...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔌 Closing database connections...');
  await pool.end();
  process.exit(0);
});

// Call on startup
testConnection();
