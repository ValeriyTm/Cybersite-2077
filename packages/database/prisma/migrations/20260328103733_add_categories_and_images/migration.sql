-- CreateEnum
CREATE TYPE "MotoCategory" AS ENUM ('Allround', 'ATV', 'Classic', 'Cross / motocross', 'Custom / cruiser', 'Enduro / offroad', 'Minibike, cross', 'Minibike, sport', 'Naked bike', 'Prototype / concept model', 'Scooter', 'Speedway', 'Sport', 'Sport touring', 'Super motard', 'Touring', 'Trial', 'Unspecified category');

-- CreateEnum
CREATE TYPE "CoolingType" AS ENUM ('Air', 'Liquid', 'Oil & air');

-- CreateEnum
CREATE TYPE "GearboxType" AS ENUM ('1-speed', '2-speed', '2-speed automatic', '3-speed', '3-speed automatic', '4-speed', '4-speed with reverse', '5-speed', '5-speed with reverse', '6-speed', '6-speed with reverse', '7-speed', '8-speed', 'Automatic');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('Belt', 'Chain', 'Cardan');

-- CreateEnum
CREATE TYPE "StarterType" AS ENUM ('Electric', 'Electric & kick', 'Kick');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Motorcycle" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "category" "MotoCategory" NOT NULL,
    "year" INTEGER NOT NULL,
    "displacement" INTEGER NOT NULL,
    "power" DOUBLE PRECISION,
    "topSpeed" INTEGER,
    "fuelConsumption" DOUBLE PRECISION,
    "engineType" TEXT,
    "fuelSystem" TEXT,
    "coolingSystem" "CoolingType",
    "gearbox" "GearboxType",
    "transmission" "TransmissionType",
    "frontTyre" TEXT,
    "rearTyre" TEXT,
    "frontBrakes" TEXT,
    "rearBrakes" TEXT,
    "colors" TEXT[],
    "starter" "StarterType",
    "comments" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price" INTEGER NOT NULL,
    "siteCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Motorcycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "motorcycleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Motorcycle_slug_key" ON "Motorcycle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SiteCategory_name_key" ON "SiteCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SiteCategory_slug_key" ON "SiteCategory"("slug");

-- AddForeignKey
ALTER TABLE "Motorcycle" ADD CONSTRAINT "Motorcycle_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Motorcycle" ADD CONSTRAINT "Motorcycle_siteCategoryId_fkey" FOREIGN KEY ("siteCategoryId") REFERENCES "SiteCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_motorcycleId_fkey" FOREIGN KEY ("motorcycleId") REFERENCES "Motorcycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
