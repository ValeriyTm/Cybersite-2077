import { Motorcycle, Warehouse } from "@repo/database";

export interface Statistics {
  topSellers: {
    model: string;
    quantity: number;
  }[];
  lowStock: {
    id: string;
    motorcycleId: string;
    warehouseId: string;
    quantity: number;
    reserved: number;
    motorcycle: Motorcycle;
    warehouse: Warehouse;
  }[];
  totalRevenue: number;
  ordersCount: number;
  period: number;
}
