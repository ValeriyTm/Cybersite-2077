//=========Seed-скрипт для заполнения БД данными=============//
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";
import * as argon2 from "argon2";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import csv from "csv-parser";

//-------------------Настройка подключения:-----------
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

//-------------------Хелперы:-----------
// Хелпер для создания URL (slug):
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
//-------------------Функция сидирования:-----------
async function main() {
  //1)-------Создаём дефолтного админа в табилце Users:-------------
  //Email для дефолтного админа:
  const adminEmail = "admin@cybersite2077.com";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    //Пароль для дефолтного админа:
    const hashedPassword = await argon2.hash("AdminPassword2077!");

    //Создаём в БД дефолтного админа:
    await prisma.user.create({
      data: {
        name: "SuperAdmin",
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "ADMIN",
        isActivated: true,
      },
    });
    console.log("✅ Дефолтный админ создан");
  } else {
    console.log("ℹ️ Дефолтный админ уже существует");
  }

  //2)-------Создаём категорию мотоциклов:-------------
  const motoCategory = await prisma.siteCategory.upsert({
    where: { slug: "motorcycles" },
    update: {},
    create: {
      name: "Мотоциклы",
      slug: "motorcycles",
      description: "Все мировые бренды мотоциклов",
    },
  });

  //Создаём оставшиеся категории:
  await prisma.siteCategory.upsert({
    where: { slug: "equipment" },
    update: {},
    create: {
      name: "Мотоэкипировка",
      slug: "equipment",
      description: "Самая надежная мотоэкипировка",
    },
  });

  await prisma.siteCategory.upsert({
    where: { slug: "spare" },
    update: {},
    create: {
      name: "Запчасти",
      slug: "spare",
      description: "Запчасти и детали под любую модель",
    },
  });

  //3)-------Заполняем таблицу брендов из csv-файла:-------------
  console.log("Импортируем бренды...");
  const brandsMap = new Map(); //Для быстрого поиска ID по названию

  const brandsPath = path.resolve(__dirname, "./data/brands.csv");
  const brandsStream = fs.createReadStream(brandsPath).pipe(csv());

  for await (const row of brandsStream) {
    const brandName = row.Brand.trim();
    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: {
        name: brandName,
        country: row.Country || "Unknown",
        slug: slugify(brandName),
      },
    });
    brandsMap.set(brandName, brand.id);
  }

  //4)-------Заполняем таблицу мотоциклов из csv-файла:-------------
  //Сопоставляем типы (слева типы в CSV, а справа в Prisma):
  const categoryMap: Record<string, any> = {
    Allround: "ALLROUND",
    ATV: "ATV",
    Classic: "CLASSIC",
    "Cross / motocross": "CROSS_MOTOCROSS",
    "Custom / cruiser": "CUSTOM_CRUISER",
    "Enduro / offroad": "ENDURO_OFFROAD",
    "Minibike, cross": "MINIBIKE_CROSS",
    "Minibike, sport": "MINIBIKE_SPORT",
    "Naked bike": "NAKED_BIKE",
    "Prototype / concept model": "PROTOTYPE_CONCEPT",
    Scooter: "SCOOTER",
    Speedway: "SPEEDWAY",
    Sport: "SPORT",
    "Sport touring": "SPORT_TOURING",
    "Super motard": "SUPER_MOTARD",
    Touring: "TOURING",
    Trial: "TRIAL",
    "Unspecified category": "UNSPECIFIED",
  };

  const coolingMap: Record<string, any> = {
    Air: "AIR",
    Liquid: "LIQUID",
    "Oil & air": "OIL_AIR",
  };

  const starterMap: Record<string, any> = {
    Electric: "ELECTRIC",
    "Electric & kick": "ELECTRIC_KICK",
    Kick: "KICK",
  };

  const gearboxMap: Record<string, any> = {
    "1-speed": "SPEED1",
    "2-speed": "SPEED2",
    "2-speed automatic": "SPEED2AUTOMATIC",
    "3-speed": "SPEED3",
    "3-speed automatic": "SPEED3AUTOMATIC",
    "4-speed": "SPEED4",
    "4-speed with reverse": "SPEED4WITHREVERSE",
    "5-speed": "SPEED5",
    "5-speed with reverse": "SPEED5WITHREVERSE",
    "6-speed": "SPEED6",
    "6-speed with reverse": "SPEED6WITHREVERSE",
    "7-speed": "SPEED7",
    "8-speed": "SPEED8",
    Automatic: "AUTOMATIC",
  };

  //Начало процесса:
  console.log("Импортируем модели мотоциклов...");
  const motoPath = path.resolve(__dirname, "./data/motorcycles.csv");
  const motoStream = fs.createReadStream(motoPath).pipe(csv());

  let count = 0;
  for await (const row of motoStream) {
    console.log("Текущая строка:", row); // отображение того, как компьютер считывает построчно CSV-файл.
    const brandId = brandsMap.get(row.brand.trim());
    if (!brandId) continue;

    try {
      //Генерируем уникальный slug на основе модели и её даты производства:
      // const fullModelName = `${row.Model}${row.Year}`;
      // const modelSlug = slugify(fullModelName);

      /////Цвета:
      //Извлекаем значение из колонки Colors:
      const rawColors = row.colors || "";
      //Превращаем строку в массив, используя ";" как разделитель:
      const processedColors = rawColors
        ? rawColors
            .split(";") // Режем по точке с запятой
            .map((item) => item.trim()) // Убираем лишние пробелы по краям
            .filter((item) => item.length > 0) // Удаляем пустые элементы, если они есть
        : [];

      console.log(processedColors);

      await prisma.motorcycle.upsert({
        where: { slug: row.slug }, // Ищем по уникальному слагу
        update: {
          price: parseInt(row.price) || 0, // Можно обновить только цены
        },
        create: {
          //Слева - название в модели Prisma, справа - название столбца в CSV файле.
          model: row.model,
          slug: row.slug,
          brandId: brandId,
          siteCategoryId: motoCategory.id,
          year: parseInt(row.year) || 0,
          displacement: parseInt(row.displacement) || 0,
          power: parseFloat(row.power) || null,
          topSpeed: parseInt(row.topSpeed) || null,
          fuelConsumption: parseFloat(row.fuelConsumption) || null,
          price: parseInt(row.price) || 0,
          rating: parseFloat(row.rating) || 0,
          //Маппинг ENUMS:
          category: categoryMap[row.category] || undefined,
          coolingSystem: coolingMap[row.coolingSystem] || undefined,
          starter: starterMap[row.starter] || undefined,
          transmission: row.transmission
            ? row.transmission.toUpperCase()
            : undefined,
          gearbox: gearboxMap[row.gearbox] || undefined,
          //Текстовые поля:
          engineType: row.engineType || null,
          fuelSystem: row.fuelSystem || null,
          frontTyre: row.frontTyre || null,
          rearTyre: row.rearTyre || null,
          frontBrakes: row.frontBrakes || null,
          rearBrakes: row.rearBrakes || null,
          comments: row.comments || null,
          //Обработка цветов:
          colors: processedColors,
        },
      });
      count++;
    } catch (e) {
      //Пропускаем дубликаты slug, если они образуются:
      console.error(`⚠️Пропущен ${row.Model}: ${e.message}`);
    }
  }
  console.log(
    `✅ Успешно! Создано ${brandsMap.size} брендов и ${count} моделей.`,
  );
}

//-------------------Запуск сидирования:-----------
main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });

//Запуск скрипта командой "npx prisma db seed" из папки packages/database
