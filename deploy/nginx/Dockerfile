# --- Этап 1: Сборка фронтенда ---
FROM node:20-alpine AS web-builder

WORKDIR /app

#Корируем зависимости:
COPY package*.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/

#Ставим зависимости:
RUN npm ci

#Копируем файлы:
COPY . .

#Принимаем аргументы из GitHub Actions и превращаем их в переменные среды для Vite
ARG VITE_API_URL
ARG VITE_SITE_URL
ARG VITE_GOOGLE_RECAPTCHA_SITE_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_GOOGLE_RECAPTCHA_SITE_KEY=$VITE_GOOGLE_RECAPTCHA_SITE_KEY

#Запуск сборки:
RUN npm run build -w web

# --- Этап 2: Финальный образ Nginx ---
FROM nginx:alpine

#Удаляем дефолтный конфиг Nginx:
RUN rm /etc/nginx/conf.d/default.conf

#Копируем кастомный конфиг в папку настроек Nginx:
#Файл nginx.conf должен лежать в той же папке, что и этот Dockerfile
COPY deploy/nginx/nginx.conf /etc/nginx/conf.d/default.conf

#Копируем собранный фронтенд из предыдущего этапа прямо в образ Nginx:
COPY --from=web-builder /app/apps/web/dist /usr/share/nginx/html

#Открываем 80 порт для внешнего мира:
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


# # Конфигурация для локальной разработки:
# # 1. Берем стабильную версию Nginx на базе Alpine
# FROM nginx:alpine

# # 2. Удаляем дефолтный конфиг Nginx, который идет "из коробки"
# RUN rm /etc/nginx/conf.d/default.conf

# # 3. Копируем твой кастомный конфиг в папку настроек Nginx
# # Файл nginx.conf должен лежать в той же папке, что и этот Dockerfile
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # 4. Открываем 80 порт для внешнего мира
# EXPOSE 80

# # 5. Запускаем Nginx:
# CMD ["nginx", "-g", "daemon off;"]