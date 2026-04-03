import { Request, Response, NextFunction } from "express";
import { warehouseService } from "./warehouse.service.js";

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

export const calculateDelivery = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { lat, lng } = req.body;

    // 1. Находим ближайший склад через PostGIS
    const results = await warehouseService.findNearestWarehouse(
      Number(lat),
      Number(lng),
    );
    console.log("results: ", results);

    // 🎯 Проверяем: если это массив — берем первый, если нет — берем сам объект
    const nearest = Array.isArray(results) ? results[0] : results;

    console.log("nearest: ", nearest);

    if (!nearest) return res.status(404).json({ message: "Склады не найдены" });

    //Передаем ЧИСЛО (distanceKm), которое лежит внутри объекта:
    const deliveryInfo = warehouseService.calculateDelivery(nearest.distanceKm);

    res.json({
      warehouse: nearest,
      ...deliveryInfo,
    });
  } catch (e) {
    next(e);
  }
};
