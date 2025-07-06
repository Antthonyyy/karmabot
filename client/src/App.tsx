// client/src/App.tsx
import { useEffect, useState } from "react";
import { initializeAuth, isTelegramWebApp } from "./utils/fetchUser";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authUtils } = useAuth();

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("🚀 Starting authentication...");

        // Пробуем авторизоваться
        const authData = await initializeAuth();

        if (authData) {
          console.log("✅ Authentication successful");
          // Пользователь уже сохранён в localStorage через fetchUser
        } else if (!isTelegramWebApp()) {
          // Не в Telegram - показываем инструкцию
          setError("not-in-telegram");
        } else {
          // В Telegram, но нет данных
          setError("no-user-data");
        }
      } catch (err) {
        console.error("❌ Auth error:", err);
        setError(err.message || "Authentication failed");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Показываем загрузку
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  // Показываем ошибку "не в Telegram"
  if (error === "not-in-telegram") {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Відкрийте в Telegram</h1>
          <p className="text-gray-600 mb-6">
            Цей додаток працює тільки в Telegram. Відкрийте його через бота.
          </p>
          <div className="space-y-4">
            <a
              href="https://t.me/YOUR_BOT_USERNAME"
              className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg"
            >
              Відкрити в Telegram
            </a>
            <div className="mt-4">
              <img
                src="/qr-code.png"
                alt="QR Code"
                className="mx-auto w-48 h-48"
              />
              <p className="text-sm text-gray-500 mt-2">
                Скануйте QR-код в Telegram
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Показываем другие ошибки
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Помилка</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  const user = authUtils.getUser();

  // Основное приложение
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Karma Tracker</h1>
          <div className="text-sm text-gray-600">
            {user?.firstName} {user?.lastName}
          </div>
        </div>
      </header>

      <main className="p-4">
        {/* Ваш основной контент */}
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">
            Ласкаво просимо, {user?.firstName}!
          </h2>
          <p className="text-gray-600">Ваш Telegram ID: {user?.telegramId}</p>
        </div>
      </main>
    </div>
  );
}
