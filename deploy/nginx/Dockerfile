# 1. Берем стабильную версию Nginx на базе Alpine
FROM nginx:alpine

# 2. Удаляем дефолтный конфиг Nginx, который идет "из коробки"
RUN rm /etc/nginx/conf.d/default.conf

# 3. Копируем твой кастомный конфиг в папку настроек Nginx
# Файл nginx.conf должен лежать в той же папке, что и этот Dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 4. Открываем 80 порт для внешнего мира
EXPOSE 80

# 5. Запускаем Nginx (команда по умолчанию для этого образа)
CMD ["nginx", "-g", "daemon off;"]
