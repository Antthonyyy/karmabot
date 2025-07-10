import { sql } from 'drizzle-orm';
import { db } from "../../db";

export async function createNewTables() {
  try {
    // Таблица subscriptions
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan VARCHAR(50) NOT NULL,
        billing_period VARCHAR(20) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        payment_order_id VARCHAR(255),
        amount NUMERIC(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'EUR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Таблица ai_requests
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        tokens_used INTEGER DEFAULT 0,
        cost NUMERIC(10,4) DEFAULT 0,
        model VARCHAR(50) DEFAULT 'gpt-3.5-turbo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Таблица ai_cache
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_cache (
        id SERIAL PRIMARY KEY,
        question_hash VARCHAR(255) NOT NULL UNIQUE,
        response TEXT NOT NULL,
        language VARCHAR(10) DEFAULT 'uk',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Таблица achievements
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type VARCHAR(100) NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notified BOOLEAN DEFAULT FALSE
      )
    `);
    
    // Создаем индексы
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_requests_user_created ON ai_requests(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
      CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_cache(question_hash);
    `);
    
    console.log('✅ Created all new tables successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}