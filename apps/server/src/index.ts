import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import argon2 from "argon2";
import { RegisterSchema } from "@repo/validation"; //Импортируем схему валидации для регистрации
import { prisma } from "@repo/database"; // Импортируем БД PostgreSQL

// Находим абсолютный путь к текущему файлу index.ts
const __filename = fileURLToPath(import.meta.url);
// Получаем путь к папке src
const __dirname = path.dirname(__filename);
// Поднимаемся на три уровня вверх: src -> server -> apps -> корень
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const app = express();

// Мидлвары
app.use(cors());
app.use(express.json());

//Роут для регистрации
app.post("/api/auth/register", async (req, res) => {
  const result = RegisterSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }

  const { email, password, name } = result.data;

  try {
    // 1. Проверяем, не занят ли email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Этот email уже занят" });
    }

    // 2. Хешируем пароль
    const passwordHash = await argon2.hash(password);

    // 3. Сохраняем в базу
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "USER", // Роль из Enum, который Prisma подхватит сама
      },
    });

    res.status(201).json({
      message: "Пользователь создан!",
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});
