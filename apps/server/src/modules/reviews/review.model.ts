import { Schema, model, Document } from "mongoose";

export interface IReview extends Document {
  userId: string; //UUID из Postgres
  userName: string; //Имя юзера для быстрого вывода
  motorcycleId: string; //UUID из Postgres
  orderId: string; //ID заказа для проверки покупки
  rating: number; //1-5
  comment: string; //Текстовый комментарий юзера
  images: string[]; // Массив URL-адресов
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  motorcycleId: { type: String, required: true, index: true },
  orderId: { type: String, required: true, unique: true }, // Один заказ = один отзыв 🛡️
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export const ReviewModel = model<IReview>("Review", ReviewSchema);
