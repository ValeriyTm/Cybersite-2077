# --- Stage 1: Base ---
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем корень и все package.json для кэширования зависимостей
COPY package*.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/

# Пропускаем скачивание Cypress
ENV CYPRESS_INSTALL_BINARY=0

# Устанавливаем все зависимости монорепозитория
RUN npm install

# --- Stage 2: Builder ---
FROM base AS builder
COPY . .

# Генерируем Prisma Client (путь к схеме в твоем пакете database)
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Собираем всё (Turborepo или просто npm build в корне)
RUN npm run build

# --- Stage 3: Server ---
FROM node:20-alpine AS server
WORKDIR /app

# # 1. Копируем ВСЕ зависимости (включая Prisma и драйверы)
# COPY --from=builder /app/node_modules ./node_modules

# # 2. Копируем пакеты базы данных и типов (сохраняем структуру монорепо)
# COPY --from=builder /app/packages ./packages

# # 3. Копируем скомпилированный код сервера
# COPY --from=builder /app/apps/server/dist ./apps/server/dist
# COPY --from=builder /app/apps/server/package.json ./apps/server/package.json

COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

EXPOSE 3001

# WORKDIR /app/dist
WORKDIR /app/apps/server
# EXPOSE 3001
# CMD ["node", "index.js"]
# CMD ["node", "dist/index.js"]
CMD ["npx", "tsx", "src/index.ts"]

# # --- Stage 4: Web (Статика через Nginx) ---
# FROM nginx:stable-alpine AS web
# # Копируем билд фронта в папку nginx
# COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# # Конфиг Nginx берем из твоей папки deploy
# COPY deploy/nginx/nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
