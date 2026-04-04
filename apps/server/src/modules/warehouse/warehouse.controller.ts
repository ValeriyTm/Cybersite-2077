import { Request, Response, NextFunction } from "express";
import { warehouseService } from "./warehouse.service.js";

//Получаем данные о всех складах:
export const getAllWarehouses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const warehouses = await warehouseService.getAll();
    res.json(warehouses);
  } catch (e) {
    next(e);
  }
};

//Расчёт стоимости и сроков доставки для заказа:
export const calculateDelivery = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { lat, lng, items } = req.body; //Получаем координаты и массив {id, quantity}

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Корзина пуста" });
    }

    //Ищем ближайший склад, способный отгрузить весь заказ за раз:
    const nearest = await warehouseService.findNearestWarehouseWithFullStock(
      Number(lat),
      Number(lng),
      items,
    );

    //Если по всем 5 складам не нашли полный комплект:
    if (!nearest) {
      return res.status(422).json({
        message:
          "К сожалению, заказ нельзя собрать на одном складе. Обратитесь к менеджеру.",
      });
    }

    //Считаем логистику:
    const deliveryInfo = warehouseService.calculateDelivery(nearest.distanceKm);

    res.json({
      warehouse: nearest,
      ...deliveryInfo,
    });
  } catch (e) {
    next(e);
  }
};
