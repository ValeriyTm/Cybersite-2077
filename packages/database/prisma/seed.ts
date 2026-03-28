//Seed-скрипт для создания дефолтного админа при запуске миграций.
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";
import * as argon2 from "argon2";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
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
}

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

//Запуск скрипта командой "npx prisma db seed"
