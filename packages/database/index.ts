import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

import pkg from "pg";
const { Pool } = pkg;
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/index.js"; // Проверь, чтобы путь вел к index.js или client

//Указываем путь к корневому .env:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const connectionString = `${process.env.DATABASE_URL}`;
if (!connectionString) {
  throw new Error(
    "❌ DATABASE_URL is missing in @repo/database package! Check your .env file in root.",
  );
}

// Настраиваем пул соединений с усредненными параметрами
const pool = new Pool({
  connectionString,
  //Максимум 10 одновременных соединений (хватит для локалки и небольшого прода):
  max: 10,
  //Ждем 30 секунд перед закрытием неиспользуемого коннекта:
  idleTimeoutMillis: 30000,
  //Если база не ответила за 2 секунды — выдаем ошибку (чтобы сервер не "висел"):
  connectionTimeoutMillis: 2000,
  //Обновляем соединение каждые 7500 запросов (защита от микро-утечек памяти в драйвере):
  maxUses: 7500,
});
//Оборачиваем подключение в адаптер:
const adapter = new PrismaPg(pool);

//Глобальная переменная для предотвращения лишних коннектов в dev-режиме (HMR):
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
//globalThis - это специальный объект в JS, который живет всё время,
//пока запущен процесс Node.js. Он не сбрасывается при перезагрузке
//отдельных файлов или модулей.

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
//Если в глобальном объекте уже есть созданный клиент (от предыдущего запуска), мы берем его.
//Если его нет (это самый первый запуск), мы создаем новый. По итогу, у нас всегда ровно одно
//активное соединение с базой, сколько бы раз ты ни сохранял файлы.

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
//В продакшене (на реальном сервере) этот механизм не нужен, так как там код не перезагружается
//при каждом изменении. Поэтому мы сохраняем клиента в глобальную переменную только во время разработки.

// Экспортируем все типы и перечисления (User, Role, Gender):
export * from "./generated/prisma/index.js";
