import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Clean DATABASE_URL - remove the prefix if it exists
const cleanDatabaseUrl = process.env.DATABASE_URL.startsWith('DATABASE_URL=') 
  ? process.env.DATABASE_URL.replace('DATABASE_URL=', '') 
  : process.env.DATABASE_URL;

console.log('📝 Database URL cleaned:', cleanDatabaseUrl.substring(0, 50) + '...');

export const pool = new Pool({ connectionString: cleanDatabaseUrl });
export const db = drizzle({ client: pool, schema });

// Test database connection
export async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const result = await db.select().from(schema.users).limit(1);
    console.log('✅ Database connection successful');
    console.log(`📊 Found ${result.length} users in database`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Call on startup
testConnection();