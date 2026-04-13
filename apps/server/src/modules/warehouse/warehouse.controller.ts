//Типы:
import { Request, Response, NextFunction } from "express";
//Главный сервис модуля Warehouse:
import { warehouseService } from "./warehouse.service.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";

//Получаем данные о всех складах:
export const getAllWarehouses = catchAsync(
  async (req: Request, res: Response) => {
    const warehouses = await warehouseService.getAll();
    res.json(warehouses);
  },
);

//Расчёт стоимости и сроков доставки для заказа:
export const calculateDelivery = catchAsync(
  async (req: Request, res: Response) => {
    const { lat, lng, items } = req.body; //Получаем координаты и массив {id, quantity}

    if (!items || items.length === 0) {
      throw new AppError(400, "Корзина пуста");
    }

    //Ищем ближайший склад, способный отгрузить весь заказ за раз:
    const nearest = await warehouseService.findNearestWarehouseWithFullStock(
      Number(lat),
      Number(lng),
      items,
    );

    //Если по всем 5 складам не нашли полный комплект:
    if (!nearest) {
      throw new AppError(
        422,
        "К сожалению, заказ нельзя собрать на одном складе. Обратитесь к менеджеру.",
      );
    }

    //Считаем логистику:
    const deliveryInfo = warehouseService.calculateDelivery(nearest.distanceKm);

    res.json({
      warehouse: nearest,
      ...deliveryInfo,
    });
  },
);
