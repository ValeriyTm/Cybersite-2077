import {
  OrderStatus,
  PaymentStatus,
  type Brand,
  type Motorcycle,
  type ProductImage,
  type Warehouse,
} from "@repo/database/generated/prisma";

export interface Order {
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
  paymentStatus: PaymentStatus;
  paymentUrl: string;
  status: OrderStatus;
  totalPrice: number;
  updatedAt: string;
  userId: string;
  warehouse: {
    city: string;
    id: string;
    lat: number;
    lng: number;
    name: string;
  };
  warehouseId: string;
}

export interface OrderItem {
  id: string;
  isReviewed: boolean;
  motorcycle: MotoInOrder;
  motorcycleId: string;
  orderId: string;
  priceAtOrder: number;
  quantity: number;
}

type MotoInOrder = Omit<Motorcycle, "brand" | "images"> & {
  brand: Brand;
  images: ProductImage[];
};

export interface DeliveryResponse {
  cost: number;
  days: number;
  distanceKm: number;
  estimatedDate: string;
  warehouse: {
    city: string;
    id: string;
    lat: number;
    lng: number;
    name: string;
  };
}

export interface CreateOrderPayload {
  items: {
    id: string;
    model: string;
    price: number;
    quantity: number;
  }[];
  address: string;
  coords: { lat: number; lng: number } | null;
  deliveryInfo: {
    warehouse: {
      id: string;
      name: string;
      city: string;
      lat: number;
      lng: number;
    };
    cost: number;
    days: number;
    estimatedDate: string;
    distanceKm: number;
  } | null;
  promoCode: string | null;
  totalPrice: number;
  shouldPay: boolean;
}

export interface DeliveryInfo {
  warehouse: Warehouse;
  cost: number;
  days: number;
  estimatedDate: string;
  distanceKm: number;
}
