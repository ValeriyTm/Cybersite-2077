# --- Stage 1: Base ---
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
RUN npm install

# --- Stage 2: Builder ---
FROM base AS builder
COPY . .

# Генерируем Prisma Client:
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

# Собираем всё:
RUN npm run build

# --- Stage 3: Server ---
FROM node:20-alpine AS server
WORKDIR /app

# Копируем все зависимости:
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Генерируем Prisma Client в финальном образе:
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma

EXPOSE 3001

WORKDIR /app/apps/server

# CMD ["npx", "tsx", "src/index.ts"]
CMD ["sh", "-c", "npx prisma migrate deploy --schema=../../packages/database/prisma/schema.prisma --config=../../packages/database/prisma.config.ts && npx tsx ../../packages/database/prisma/seed.ts && npx tsx src/index.ts"]

# # --- Stage 4: Web (Статика через Nginx) ---
# FROM nginx:stable-alpine AS web
# # Копируем билд фронта в папку nginx
# COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# # Конфиг Nginx берем из папки deploy
# COPY deploy/nginx/nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
