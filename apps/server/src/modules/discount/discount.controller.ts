//Типы:
import { Request, Response } from "express";
import { AuthRequest } from "../../shared/middlewares/auth.middleware.js";
//Главный сервис модуля Discount:
import { discountService } from "./discount.service.js";
//Для генерации событий:
import { eventBus, EVENTS } from "../../shared/lib/eventBus.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";

//Применение промокода:
export const applyPromoCode = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { code } = req.body;
    const userId = req.user.id;

    const promo = await discountService.applyPromoCode(code, userId);

    res.json({
      code: promo.promoCode,
      discountAmount: promo.promoDiscountAmount,
    });
  },
);

//Получение текущей глобальной скидки:
export const getGlobalDiscount = catchAsync(
  async (_req: Request, res: Response) => {
    const data = await discountService.getGlobalDiscount();
    res.json(data);
  },
);

//Тестовый запуск генерации (только для админа):
export const triggerDiscountGen = catchAsync(
  async (_req: AuthRequest, res: Response) => {
    const globals = await discountService.generateGlobalDiscount();
    const personals = await discountService.generatePersonalDiscounts();
    const promos = await discountService.generateWeeklyPromos();

    //Вызываем события для генерации оповещений в ТГ:
    eventBus.emit(EVENTS.DISCOUNT_GENERATED, {
      year: globals.globalYear,
      percent: globals.globalPercent,
      personalCount: personals.personalCount,
      promoCodes: promos.join(", "),
    });

    res.json({ message: "Скидки и промокоды успешно обновлены!" });
  },
);

//Получить все действующие промокоды:
export const getAllActivePromos = catchAsync(
  async (_req: Request, res: Response) => {
    const promos = await discountService.getAllActivePromos();
    res.json(promos);
  },
);
