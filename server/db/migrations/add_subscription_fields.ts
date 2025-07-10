import { sql } from 'drizzle-orm';
import { db } from "../../db";

export async function addSubscriptionFields() {
  try {
    // Добавляем новые поля в таблицу users
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS subscription VARCHAR(50) DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'uk'
    `);
    
    console.log('✅ Added subscription fields to users table');
  } catch (error) {
    console.error('Error adding subscription fields:', error);
    // Если поля уже существуют, продолжаем
  }
}