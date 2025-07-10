// server/middleware/checkSubscription.ts

import { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../types";

// Иерархия планов (от низшего к высшему)
const PLAN_HIERARCHY = {
  free: 0,
  light: 1,
  plus: 2,
  pro: 3
};

export function checkSubscription(requiredPlan: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userPlan = user.subscription || "free";
    const endDate = user.subscriptionEndDate;
    
    // Проверяем, активна ли подписка
    const isActive = endDate ? new Date(endDate) > new Date() : userPlan === "free";
    
    if (!isActive) {
      return res.status(403).json({ 
        error: "Ваша підписка закінчилася",
        code: "SUBSCRIPTION_EXPIRED",
        expiredAt: endDate
      });
    }

    // Проверяем уровень подписки (иерархическая проверка)
    const userLevel = PLAN_HIERARCHY[userPlan] || 0;
    const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0;
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        error: `Недостатньо доступу. Потрібна підписка: ${requiredPlan}`,
        code: "INSUFFICIENT_PLAN",
        currentPlan: userPlan,
        requiredPlan: requiredPlan,
        upgrade: true
      });
    }

    next();
  };
}

// Специальный middleware для проверки лимитов (например, для AI)
export function checkFeatureLimit(featureName: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const plan = user.subscription || "free";
    
    // Определяем лимиты для каждого плана
    const limits = {
      ai_requests: {
        free: 0,
        light: 5,
        plus: 20,
        pro: -1 // unlimited
      },
      export_monthly: {
        free: 0,
        light: 3,
        plus: 10,
        pro: -1
      }
    };

    const featureLimits = limits[featureName];
    if (!featureLimits) {
      return next(); // Если лимит не определен, пропускаем
    }

    const userLimit = featureLimits[plan] || 0;
    
    if (userLimit === 0) {
      return res.status(403).json({
        error: `Ця функція недоступна на вашому плані`,
        code: "FEATURE_NOT_AVAILABLE",
        feature: featureName,
        currentPlan: plan,
        upgrade: true
      });
    }

    // Здесь нужно проверить текущее использование
    // Это зависит от вашей системы учета использования
    
    req.featureLimit = userLimit; // Передаем лимит дальше
    next();
  };
}

// Утилита для проверки доступа к функции на фронтенде
export function hasAccess(userPlan: string, requiredPlan: string): boolean {
  const userLevel = PLAN_HIERARCHY[userPlan] || 0;
  const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0;
  return userLevel >= requiredLevel;
}
