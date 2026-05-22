/*
  Warnings:

  - A unique constraint covering the columns `[customerEmail,promoCodeId]` on the table `UsedPromo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerEmail` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerEmail` to the `UsedPromo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "UsedPromo" DROP CONSTRAINT "UsedPromo_userId_fkey";

-- DropIndex
DROP INDEX "UsedPromo_userId_promoCodeId_key";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerEmail" TEXT NULL,
ADD COLUMN     "customerName" TEXT NULL,
ADD COLUMN     "customerPhone" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "UsedPromo" ADD COLUMN     "customerEmail" TEXT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UsedPromo_customerEmail_promoCodeId_key" ON "UsedPromo"("customerEmail", "promoCodeId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsedPromo" ADD CONSTRAINT "UsedPromo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 1. Переносим email и имя из таблицы users в таблицу Order
UPDATE "Order"
SET 
  "customerEmail" = users.email,
  "customerName" = users.name
FROM users
WHERE "Order"."userId" = users.id;

-- 2. Переносим email в UsedPromo
UPDATE "UsedPromo"
SET "customerEmail" = users.email
FROM users
WHERE "UsedPromo"."userId" = users.id;

-- 3. Заполняем дефолтные заглушки на случай, если у заказа не было юзера
UPDATE "Order" SET "customerEmail" = 'deleted@user.com', "customerName" = 'Удаленный пользователь' WHERE "customerEmail" IS NULL;
UPDATE "UsedPromo" SET "customerEmail" = 'deleted@user.com' WHERE "customerEmail" IS NULL;

-- 4. И только теперь принудительно делаем колонки обязательными
ALTER TABLE "Order" ALTER COLUMN "customerEmail" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "customerName" SET NOT NULL;
ALTER TABLE "UsedPromo" ALTER COLUMN "customerEmail" SET NOT NULL;
