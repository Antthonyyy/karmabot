console.log("🔧 Loading webhooks module...");
// server/routes/webhooks.ts
import { Router } from "express";
import { createHash } from "crypto";
import { subscriptionService } from "../services/subscriptionService.js";
import { storage } from "../storage.js";
// import { bot } from "../bot/index.js"; // Временно отключено
import { getGreeting } from "../telegram-bot.js";

const router = Router();

// WayForPay webhook handler
router.post("/wayforpay", async (req, res) => {
  try {
    console.log("🔔 WayForPay webhook received:", req.body);

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

    const expectedSignature = createHash("md5")
      .update(signString + ";" + process.env.WAYFORPAY_SECRET)
      .digest("hex");

    if (merchantSignature !== expectedSignature) {
      console.error("❌ Invalid WayForPay signature");
      return res
        .status(400)
        .json({ status: "error", message: "Invalid signature" });
    }

    // Handle successful payment
    if (transactionStatus === "Approved") {
      try {
        // Activate subscription
        const subscription =
          await subscriptionService.activateSubscription(orderReference);
        console.log("✅ Subscription activated:", subscription);

        // Get user for Telegram notification
        const user = await storage.getUserById(subscription.userId);

        if (user && user.telegramId) {
          await sendPaymentSuccessNotification(user, subscription);
        }

        // Respond to WayForPay
        res.json({
          orderReference,
          status: "accept",
          time: Math.floor(Date.now() / 1000),
        });
      } catch (error) {
        console.error("❌ Error activating subscription:", error);
        res.status(500).json({
          status: "error",
          message: "Failed to activate subscription",
        });
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

    // await bot.sendMessage(user.telegramId, message, { // Временно отключено
    console.log('📨 Would send Telegram notification:', message);

    // Send additional message for Pro users about AI chat
    if (subscription.plan === "pro") {
      setTimeout(async () => {
        // await bot.sendMessage(
        //   user.telegramId,
        //   `🤖 Тепер ви маєте доступ до необмеженого AI-чату!\n\n` +
        //     `Просто напишіть мені будь-яке питання, і я дам персональну пораду на основі вашого щоденника.\n\n` +
        //     `Спробуйте прямо зараз! 💬`,
        //   {
        //     reply_markup: {
        //       inline_keyboard: [
        //         [{ text: "💡 Отримати AI-пораду", callback_data: "ai_advice" }],
        //       ],
        //     },
        //   },
        // ); // Временно отключено
      }, 2000);
    }
  } catch (error) {
    console.error("❌ Error sending Telegram notification:", error);
  }
}
console.log(
  "🔧 Webhooks router created with routes:",
  router.stack?.length || "unknown",
);
export default router;
