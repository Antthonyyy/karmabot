import { addSubscriptionFields } from './migrations/add_subscription_fields';
import { createNewTables } from './migrations/create_new_tables';

async function runMigrations() {
  console.log('🚀 Running database migrations...');
  
  try {
    // Добавляем поля в users
    await addSubscriptionFields();
    
    // Создаем новые таблицы
    await createNewTables();
    
    console.log('✅ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();