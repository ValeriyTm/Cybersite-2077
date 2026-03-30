//Скрипт для заполнения таблицы Brand в БД адресами на изображения.
//Запускаю командой "npx tsx src/scripts/imagesForBrands.ts" из apps/server
import { prisma } from "@repo/database";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_PATH = path.join(__dirname, "../../uploads/brands");

async function syncBrandImages() {
  try {
    // 1. Читаем все файлы из папки
    const files = fs.readdirSync(UPLOADS_PATH);

    // 2. Создаем Map для быстрого поиска: { 'nike': 'nike.png' }
    // path.parse(file).name извлекает имя файла БЕЗ расширения
    const fileMap = new Map<string, string>();
    files.forEach((file) => {
      const fileNameWithoutExt = path.parse(file).name;
      fileMap.set(fileNameWithoutExt, file);
    });

    // 3. Получаем все бренды, где еще нет изображения (или вообще все)
    const brands = await prisma.brand.findMany({
      select: { id: true, slug: true },
    });

    console.log(`Найдено брендов в БД: ${brands.length}`);
    let updatedCount = 0;

    // 4. Сопоставляем slug и имя файла
    for (const brand of brands) {
      if (fileMap.has(brand.slug)) {
        const fileName = fileMap.get(brand.slug);
        const imagePublicPath = `${fileName}`; // Путь, который будет в БД

        await prisma.brand.update({
          where: { id: brand.id },
          data: { image: imagePublicPath },
        });

        updatedCount++;
        console.log(`✅ Обновлен ${brand.slug}: ${imagePublicPath}`);
      }
    }

    console.log(`--- Итог: обновлено записей: ${updatedCount} ---`);
  } catch (error) {
    console.error("Ошибка:", error);
  } finally {
    await prisma.$disconnect();
  }
}

syncBrandImages();
