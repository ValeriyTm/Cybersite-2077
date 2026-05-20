export interface Stock {
  id: string;
  motorcycle: {
    model: string;
  };
  motorcycleId: string;
  quantity: number;
  reserved: number;
  warehouse: {
    city: string;
    name: string;
  };
  warehouseId: string;
}
