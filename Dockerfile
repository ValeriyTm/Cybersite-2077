# ------------------Многоэтапная сборка (multi-stage build)--------------------- #
# --- Этап 1: Base (установка всех зависимостей) ---
# Этот этап позволит нам при изменении кода без изменения зависимостей перезапустить контейнер без повторной установки всех зависимостей. Тут ставим вообще все зависимости проекта (в т.ч. dev), чтобы на следующем этапе сгенерировать код.
FROM node:20-alpine AS base
# Ставим библиотеку совместимости для корректной работы Prisma в Alpine:
RUN apk add --no-cache libc6-compat 
WORKDIR /app

# Копируем корневой и все остальные package.json по всему проекту внутрь контейнера:
COPY package*.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/

# Пропускаем скачивание Cypress (экономия места и времени сборки):
ENV CYPRESS_INSTALL_BINARY=0

# Устанавливаем все зависимости проекта:
RUN npm ci 

# --- Этап 2: Builder ---
# На этом этапе генерируем код, который пойдет в финальный образ. Для этого этапа нужны все зависимости, в т.ч. dev.
FROM base AS builder

# Копируем весь код проекта в контейнер:
COPY . .

# Генерируем Prisma Client:
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Прогоняем тесты перед сборкой (можно раскомментировать, если не используется CI):
# RUN npm run test 

# Собираем всё:
RUN npm run build

# --- Этап 3: Cleaner (Оставляем только продакшн-зависимости) ---
# Очищаем этап base от dev-зависимостей, т.е. на этом этапе получаем только prod-зависимости.
FROM base AS production-deps
WORKDIR /app

# Выбрасываем dev-зависимости и чистим npm-кэш:
RUN npm ci --omit=dev && npm cache clean --force

# --- Этап 4: Server ---
# Главный этап. Тут используем зависимости с production-deps этапа и сгенерированный код с этапа builder, а также делаем прочую работу.
FROM node:20-alpine AS server
WORKDIR /app

# Копируем prod-зависимости (т.е. все зависимости берем с этапа production-deps):
COPY --from=production-deps /app/node_modules ./node_modules
COPY . .

# Копируем сгенерированную призму:
COPY --from=builder /app/packages/database/generated ./packages/database/generated

EXPOSE 3001
WORKDIR /app/apps/server

CMD ["sh", "-c", "npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma --config=../../packages/database/prisma.config.ts && npx tsx ../../packages/database/prisma/seed.ts && npx tsx src/scripts/syncImages.ts && npx tsx src/scripts/imagesForBrands.ts &&  npx tsx src/scripts/syncElastic.ts &&  npx tsx src/scripts/generatePromos.ts && npx tsx src/index.ts"]

# Короткий вариант для тестов:
# CMD ["sh", "-c", "npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma --config=../../packages/database/prisma.config.ts  &&  npx tsx src/scripts/syncElastic.ts && npx tsx src/index.ts"]


# Dockerfile с PUPPETEER (для работы pdf сервиса) (не использую пока, т.к. много ресурсов потребляет):

# # ------------------Многоэтапная сборка (multi-stage build)--------------------- #
# # --- Этап 1: Base (установка всех зависимостей) ---
# # Этот этап позволит нам при изменении кода без изменения зависимостей перезапустить контейнер без повторной установки всех зависимостей. Тут ставим вообще все зависимости проекта (в т.ч. dev), чтобы на следующем этапе сгенерировать код.
# FROM node:20-alpine AS base
# # Ставим библиотеку совместимости для корректной работы Prisma в Alpine:
# RUN apk add --no-cache libc6-compat 
# WORKDIR /app

# # Копируем корневой и все остальные package.json по всему проекту внутрь контейнера:
# COPY package*.json ./
# COPY apps/server/package.json ./apps/server/
# COPY apps/web/package.json ./apps/web/
# COPY packages/database/package.json ./packages/database/
# COPY packages/types/package.json ./packages/types/
# COPY packages/validation/package.json ./packages/validation/

# # Пропускаем скачивание Cypress и встроенного Chrome (экономия места и времени сборки):
# ENV CYPRESS_INSTALL_BINARY=0
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# # Устанавливаем все зависимости проекта:
# RUN npm ci 

# # --- Этап 2: Builder ---
# # На этом этапе генерируем код, который пойдет в финальный образ. Для этого этапа нужны все зависимости, в т.ч. dev.
# FROM base AS builder

# # Копируем весь код проекта в контейнер:
# COPY . .

# # Генерируем Prisma Client:
# RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# # Прогоняем тесты перед сборкой (можно раскомментировать, если не используется CI):
# # RUN npm run test 

# # Собираем всё:
# RUN npm run build

# # --- Этап 3: Cleaner (Оставляем только продакшн-зависимости) ---
# # Очищаем этап base от dev-зависимостей, т.е. на этом этапе получаем только prod-зависимости.
# FROM base AS production-deps
# WORKDIR /app

# # Выбрасываем dev-зависимости и чистим npm-кэш:
# RUN npm ci --omit=dev && npm cache clean --force

# # --- Этап 4: Server ---
# # Главный этап. Тут используем зависимости с production-deps этапа и сгенерированный код с этапа builder, а также делаем прочую работу.
# FROM node:20-alpine AS server
# WORKDIR /app


# # Для работы Puppeteer (если не нужен pdf-сервис, то для экономии ресурсов закомментировать):
# RUN apk add --no-cache \
#       chromium \
#       nss \
#       freetype \
#       harfbuzz \
#       ca-certificates \
#       ttf-freefont
# # Для работы Puppeteer (если не нужен pdf-сервис, то для экономии ресурсов закомментировать):
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# # Копируем prod-зависимости (т.е. все зависимости берем с этапа production-deps):
# COPY --from=production-deps /app/node_modules ./node_modules
# COPY . .

# # Копируем сгенерированную призму:
# COPY --from=builder /app/packages/database/generated ./packages/database/generated

# # Копируем сбилженные файлы (если нужно будет уходить от tsx):
# # COPY --from=builder /app/apps/server/dist ./apps/server/dist

# EXPOSE 3001
# WORKDIR /app/apps/server

# # CMD ["sh", "-c", "npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma --config=../../packages/database/prisma.config.ts && npx tsx ../../packages/database/prisma/seed.ts && npx tsx src/scripts/syncImages.ts && npx tsx src/scripts/imagesForBrands.ts &&  npx tsx src/scripts/syncElastic.ts &&  npx tsx src/scripts/generatePromos.ts && npx tsx src/index.ts"]
# # Короткий вариант для тестов:
# CMD ["sh", "-c", "npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma --config=../../packages/database/prisma.config.ts  &&  npx tsx src/scripts/syncElastic.ts && npx tsx src/index.ts"]

