import { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/database";
import { redis } from "src/lib/redis.js";
import { discountService } from "./discount.service.js";
import { AuthRequest } from "src/shared/middlewares/auth.middleware.js";

export const checkPromoCode = async (req: Request, res: Response) => {
  const { code } = req.body;

  const promo = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase(), isActive: true },
  });

  if (!promo || promo.expiresAt < new Date()) {
    return res.status(404).json({ message: "Промокод не найден или истек" });
  }

  res.json({
    code: promo.code,
    discountAmount: promo.discountAmount,
  });
};

//Применение промокода:
export const applyPromoCode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase(), isActive: true },
      include: { usedPromos: { where: { userId } } }, //Подтягиваем использование этим юзером
    });

    if (!promo || promo.expiresAt < new Date()) {
      return res.status(404).json({ message: "Промокод не найден или истек" });
    }

    //Если промокод уже использован юзером - отказ
    const alreadyUsed = await prisma.usedPromo.findFirst({
      where: { userId, promoCodeId: promo.id },
    });
    if (alreadyUsed) {
      return res
        .status(400)
        .json({ message: "Вы уже использовали этот промокод" });
    }

    res.json({
      code: promo.code,
      discountAmount: promo.discountAmount,
    });
  } catch (e) {
    next(e);
  }
};

//Получение текущей глобальной скидки:
export const getGlobalDiscount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const raw = await redis.get("global_sale");
    const data = raw ? JSON.parse(raw) : null;
    res.json(data);
  } catch (e) {
    next(e);
  }
};

//Тестовый запуск генерации (только для админа):
export const triggerDiscountGen = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    await discountService.generateGlobalDiscount();
    await discountService.generatePersonalDiscounts();
    await discountService.generateWeeklyPromos();
    res.json({ message: "Скидки и промокоды успешно обновлены!" });
  } catch (e) {
    next(e);
  }
};

//Получить все действующие промокоды:
export const getAllActivePromos = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const promos = await prisma.promoCode.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() }, //Только действующие
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(promos);
  } catch (e) {
    next(e);
  }
};
