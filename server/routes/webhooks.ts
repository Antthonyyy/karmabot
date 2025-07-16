console.log("🔧 Loading webhooks module...");
// server/routes/webhooks.ts
import { Router } from "express";
import { createHash } from "crypto";
import { storage } from "../storage.js";
import { bot } from "../bot/index.js";
import { getGreeting } from "../telegram-bot.js";
import { db } from "../db.js";
import { subscriptions } from "../../shared/schema.js";
import { eq, and } from "drizzle-orm";

const router = Router();

// ИСПРАВЛЕНИЕ Race Condition: Map для отслеживания обрабатываемых платежей
const processingPayments = new Map<string, Promise<any>>();

// WayForPay webhook handler
router.post("/wayforpay", async (req, res) => {
  try {
    console.log("🔔 WayForPay webhook received");

    const {
      merchantSignature,
      orderReference,
      amount,
      currency,
      authCode,
      transactionStatus,
      reasonCode,
      merchantAccount,
    } = req.body;

    // Verify signature
    const signString = [
      merchantAccount,
      orderReference,
      amount,
      currency,
      authCode,
      transactionStatus,
      reasonCode,
    ].join(";");

    // ИСПРАВЛЕНИЕ: Используем SHA-256 вместо слабого MD5
    const expectedSignature = createHash("sha256")
      .update(signString + ";" + process.env.WAYFORPAY_SECRET)
      .digest("hex");

    if (merchantSignature !== expectedSignature) {
      console.error("❌ Invalid WayForPay signature");
      return res
        .status(400)
        .json({ status: "error", message: "Invalid signature" });
    }

    // ИСПРАВЛЕНИЕ Race Condition: Проверяем, не обрабатывается ли уже этот платеж
    if (processingPayments.has(orderReference)) {
      console.log("⏳ Payment already being processed:", orderReference);
      return res.json({
        orderReference,
        status: "processing",
        time: Math.floor(Date.now() / 1000),
      });
    }

    // Handle successful payment
    if (transactionStatus === "Approved") {
      // Создаем Promise для обработки платежа
      const processingPromise = processPayment(orderReference, amount, currency);
      processingPayments.set(orderReference, processingPromise);

      try {
        const result = await processingPromise;
        
        // Respond to WayForPay
        res.json({
          orderReference,
          status: "accept",
          time: Math.floor(Date.now() / 1000),
        });
      } catch (error) {
        console.error("❌ Error processing payment:", error);
        res.status(500).json({
          status: "error",
          message: "Failed to process payment",
        });
      } finally {
        // Убираем из processing map
        processingPayments.delete(orderReference);
      }
    } else {
      console.log("❌ Payment not approved:", transactionStatus, reasonCode);
      res.json({
        orderReference,
        status: "decline",
        time: Math.floor(Date.now() / 1000),
      });
    }
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

// Extracted payment processing function для лучшей структуры кода
async function processPayment(orderReference: string, amount: string, currency: string) {
  // Parse order reference to extract user ID and plan
  const [userId, plan] = orderReference.split('-');
  
  if (!userId || !plan) {
    throw new Error('Invalid order reference format');
  }
  
  // Mark existing subscriptions as replaced
  await db.update(subscriptions)
    .set({ status: 'replaced' })
    .where(and(
      eq(subscriptions.userId, parseInt(userId)),
      eq(subscriptions.status, 'active')
    ));
  
  // Create new paid subscription
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1); // 30 days from now
  
  const subscription = await storage.createSubscription({
    userId: parseInt(userId),
    plan: plan as 'light' | 'plus' | 'pro',
    status: 'active',
    startedAt: new Date(),
    expiresAt: expiresAt,
    paymentOrderId: orderReference,
    amount: amount,
    currency: currency
  });
  
  console.log("✅ Paid subscription activated:", subscription);

  // Get user for Telegram notification
  const user = await storage.getUser(subscription.userId);

  if (user && user.telegramId) {
    await sendPaymentSuccessNotification(user, subscription);
  }

  return subscription;
}

// Send payment success notification to Telegram
async function sendPaymentSuccessNotification(user: any, subscription: any) {
  try {
    const planNames = {
      light: "🌟 Карма Лайт",
      plus: "⭐ Карма Плюс",
      pro: "💎 Карма Про",
    };

    const planName = planNames[subscription.plan] || subscription.plan;
    const greeting = getGreeting(user.firstName || "друже");

    const features = {
      light: [
        "📊 Розширена статистика",
        "🏆 Досягнення",
        "📤 Експорт даних",
        "📱 Telegram нагадування",
      ],
      plus: [
        "📊 Повна статистика",
        "🤖 AI-поради (5/місяць)",
        "🏆 Досягнення та геймифікація",
        "📈 Аналітика настрою",
        "📤 Експорт даних",
      ],
      pro: [
        "🚀 Все з Плюс",
        "💬 Необмежений AI-чат",
        "🎯 Персональні інсайти",
        "⭐ Пріоритетна підтримка",
        "🔮 Ексклюзивні функції",
      ],
    };

    const planFeatures = features[subscription.plan] || [];
    const endDate = new Date(subscription.endDate).toLocaleDateString("uk-UA");

    const message =
      `${greeting}\n\n` +
      `🎉 Підписка успішно активована!\n\n` +
      `💎 План: ${planName}\n` +
      `💰 Сума: ${subscription.amount} ${subscription.currency}\n` +
      `📅 Діє до: ${endDate}\n\n` +
      `🌟 Ваші нові можливості:\n` +
      planFeatures.map((feature) => `• ${feature}`).join("\n") +
      `\n\n🚀 Почніть користуватися новими функціями прямо зараз!`;

    await bot.sendMessage(user.telegramId, message, {
      parse_mode: "HTML",
    });

    // Send additional message for Pro users about AI chat
    if (subscription.plan === "pro") {
      setTimeout(async () => {
        await bot.sendMessage(
          user.telegramId,
          `🤖 Тепер ви маєте доступ до необмеженого AI-чату!\n\n` +
            `Просто напишіть мені будь-яке питання, і я дам персональну пораду на основі вашого щоденника.\n\n` +
            `Спробуйте прямо зараз! 💬`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "💡 Отримати AI-пораду", callback_data: "ai_advice" }],
              ],
            },
          },
        );
      }, 2000);
    }
  } catch (error) {
    console.error("❌ Error sending Telegram notification:", error);
    // НЕ кидаем ошибку наружу, чтобы не сломать основной flow
  }
}

console.log(
  "🔧 Webhooks router created with routes:",
  router.stack?.length || "unknown",
);
export default router;
