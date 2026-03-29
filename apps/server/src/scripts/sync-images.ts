//Скрипт для заполнения таблицы изображений в БД.
//Запускаю командой "npx tsx src/scripts/sync-images.ts" из apps/server
import { prisma } from "@repo/database";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_PATH = path.join(__dirname, "../../uploads/motorcycles");

async function syncImages() {
  console.log("🚀 Начинаем синхронизацию изображений с базой...");

  // 1. Читаем все файлы из папки
  const files = fs.readdirSync(UPLOADS_PATH);

  // 2. Получаем все мотоциклы из базы
  const motorcycles = await prisma.motorcycle.findMany({
    select: { id: true, slug: true },
  });

  for (const moto of motorcycles) {
    // Ищем файлы, которые начинаются со слага этого мотоцикла
    const motoFiles = files.filter(
      (file) =>
        file.startsWith(moto.slug) &&
        (file.endsWith(".jpg") || file.endsWith(".png")),
    );

    if (motoFiles.length > 0) {
      // Сначала удаляем старые записи об изображениях для этого мота (чтобы не дублировать)
      await prisma.productImage.deleteMany({
        where: { motorcycleId: moto.id },
      });

      // Создаем новые записи
      const imageRecords = motoFiles.map((fileName) => ({
        motorcycleId: moto.id,
        url: fileName, // Сохраняем только имя файла
        isMain: fileName === `${moto.slug}.jpg`, // Главное фото, если имя совпадает со слагом
      }));

      await prisma.productImage.createMany({ data: imageRecords });
      console.log(`✅ Обновлено ${motoFiles.length} фото для: ${moto.slug}`);
    }
  }

  console.log("🏁 Синхронизация завершена!");
}

syncImages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
