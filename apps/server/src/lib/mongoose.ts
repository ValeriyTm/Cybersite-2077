import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/cyber_moto_reviews";

export const connectMongoDB = async () => {
  try {
    // Настройки для стабильного подключения
    mongoose.set("strictQuery", false);

    await mongoose.connect(MONGO_URI);

    console.log("✅MongoDB подключен успешно");
  } catch (error) {
    console.error("❌Ошибка подключения к MongoDB:", error);
    process.exit(1); //Останавливаем сервер, если база недоступна
  }
};
