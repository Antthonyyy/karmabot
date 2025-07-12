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

// Create connection pool with proper configuration for production
export const pool = new Pool({
  connectionString: databaseUrl,
  max: 20,                    // Увеличиваем максимальное количество соединений
  min: 5,                     // Увеличиваем минимальное количество соединений
  idleTimeoutMillis: 300000,  // 5 минут вместо 30 секунд
  connectionTimeoutMillis: 20000, // 20 секунд вместо 5 секунд
  keepAlive: true,            // Поддерживать соединения активными
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });

// Test database connection with retry logic
export async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    const result = await retryDatabaseOperation(
      () => db.select({ id: schema.users.id }).from(schema.users).limit(1),
      3,
      2000
    );
    
    console.log('✅ Database connection successful');
    console.log(`📊 Found ${result.length} users in database`);
    
    // Test connection pool health
    console.log('🔍 Connection pool status:', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    });
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed after retries:', error);
    console.error('🔧 Check DATABASE_URL and database server availability');
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

// Utility function to retry database operations
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a connection error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isConnectionError = errorMessage.includes('Connection terminated') || 
                              errorMessage.includes('connection') || 
                              errorMessage.includes('timeout');
      
      if (attempt === maxRetries || !isConnectionError) {
        console.error(`❌ Database operation failed after ${attempt} attempts:`, error);
        throw error;
      }
      
      console.warn(`⚠️ Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  throw lastError;
}
