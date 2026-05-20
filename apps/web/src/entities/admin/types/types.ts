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

export interface OrderResponse {
  data: OrderFromServer[];
  meta: {
    lastPage: number;
    page: number;
    total: number;
  };
}

export interface OrderFromServer {
  address: string;
  createdAt: string;
  deliveryCost: number;
  deliveryLat: number;
  deliveryLng: number;
  distance: number;
  estimatedDate: string;
  id: string;
  items: OrderItem[];
  orderNumber: number;
  paymentId: string;
  paymentStatus: string;
  paymentUrl: string;
  status: OrderStatus;
  totalPrice: number;
  updatedAt: string;
  user: {
    email: string;
    name: string;
    phone: string;
  };
  userId: string;
  warehouseId: string;
}

enum OrderStatus {
  pending,
  paid,
  canceled,
  delivery,
  delivered,
  completed,
}

export interface OrderItem {
  id: string;
  motorcycle: {
    model: string;
  };
  motorcycleId: string;
  orderId: string;
  priceAtOrder: number;
  quantity: number;
}

export type OrderStatusUp =
  | "PENDING"
  | "PAID"
  | "CANCELED"
  | "DELIVERY"
  | "DELIVERED"
  | "COMPLETED";
