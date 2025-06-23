export function checkEnvVariables() {
  const required = [
    'OPENAI_API_KEY',
    'WAYFORPAY_MERCHANT', 
    'WAYFORPAY_SECRET',
    'FRONTEND_URL',
    'JWT_SECRET',
    'DATABASE_URL',
    'TELEGRAM_BOT_TOKEN'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Отсутствуют переменные окружения:', missing);
    console.log('📝 Добавьте их в Replit Secrets или .env файл');
    missing.forEach(key => {
      console.log(`- ${key}`);
    });
    return false;
  }
  
  console.log('✅ Все переменные окружения настроены');
  return true;
}

export function logEnvStatus() {
  const envVars = [
    'OPENAI_API_KEY',
    'WAYFORPAY_MERCHANT', 
    'WAYFORPAY_SECRET',
    'FRONTEND_URL',
    'JWT_SECRET',
    'DATABASE_URL',
    'TELEGRAM_BOT_TOKEN'
  ];
  
  console.log('\n🔍 Статус переменных окружения:');
  envVars.forEach(key => {
    const value = process.env[key];
    if (value) {
      console.log(`✅ ${key}: ${value.length > 20 ? value.substring(0, 20) + '...' : value}`);
    } else {
      console.log(`❌ ${key}: не задано`);
    }
  });
  console.log('');
}

// Утилита для получения конфигурации приложения
export function getAppConfig() {
  return {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      available: !!process.env.OPENAI_API_KEY
    },
    wayforpay: {
      merchant: process.env.WAYFORPAY_MERCHANT,
      secret: process.env.WAYFORPAY_SECRET,
      available: !!(process.env.WAYFORPAY_MERCHANT && process.env.WAYFORPAY_SECRET)
    },
    app: {
      frontendUrl: process.env.FRONTEND_URL,
      jwtSecret: process.env.JWT_SECRET,
      databaseUrl: process.env.DATABASE_URL
    },
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      available: !!process.env.TELEGRAM_BOT_TOKEN
    }
  };
}