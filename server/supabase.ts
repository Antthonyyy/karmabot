import { createClient } from '@supabase/supabase-js';

// Извлекаем данные подключения из URL базы данных
const dbUrl = process.env.DATABASE_URL || '';
const urlParts = dbUrl.match(/postgresql:\/\/postgres\.([^:]+):([^@]+)@([^\/]+)\/(.+)/);

if (!urlParts) {
  throw new Error('Invalid DATABASE_URL format for Supabase');
}

const [, projectRef, password, host, database] = urlParts;
const supabaseUrl = `https://${projectRef}.supabase.co`;

export const supabase = createClient(supabaseUrl, password, {
  auth: {
    persistSession: false, // Для серверной части
  },
});

console.log('🔗 Supabase Storage client initialized');