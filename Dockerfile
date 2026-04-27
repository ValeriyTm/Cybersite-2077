# --- Stage 1: Base (установка всех зависимостей) ---
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем корневой и все остальные package.json по всему проекту:
COPY package*.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/

# Пропускаем скачивание Cypress:
ENV CYPRESS_INSTALL_BINARY=0

# Устанавливаем все зависимости монорепозитория:
RUN npm ci 

# --- Stage 2: Builder ---
FROM base AS builder
COPY . .

# Генерируем Prisma Client:
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Прогоняем тесты перед сборкой (можно раскомментировать, если не используется ci):
# RUN npm run test 
# Собираем всё:
RUN npm run build

# --- Stage 3: Cleaner (Оставляем только продакшн-зависимости) ---
FROM base AS production-deps
WORKDIR /app
# Выдрасываем dev-зависимости и чистим npm-кэш:
RUN npm ci --omit=dev && npm cache clean --force

# --- Stage 4: Server ---
FROM node:20-alpine AS server
WORKDIR /app

# Копируем prod-зависимости:
COPY --from=production-deps /app/node_modules ./node_modules
COPY . .

# Копируем сгенерированную призму:
COPY --from=builder /app/packages/database/generated ./packages/database/generated

# Копируем сбилженные файлы (если нужно будет уходить от tsx):
# COPY --from=builder /app/apps/server/dist ./apps/server/dist

EXPOSE 3001
WORKDIR /app/apps/server

CMD ["sh", "-c", "npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma --config=../../packages/database/prisma.config.ts && npx tsx ../../packages/database/prisma/seed.ts && npx tsx src/scripts/syncImages.ts && npx tsx src/scripts/imagesForBrands.ts &&  npx tsx src/scripts/syncElastic.ts &&  npx tsx src/scripts/generatePromos.ts && npx tsx src/index.ts"]
# Короткий вариант для тестов:
# CMD ["sh", "-c", "npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma --config=../../packages/database/prisma.config.ts  &&  npx tsx src/scripts/syncElastic.ts && npx tsx src/index.ts"]

