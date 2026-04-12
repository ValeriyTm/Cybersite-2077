//----------Тут только запуск сервера
//Подключаем .env корневого проекта:
import "./shared/env.js"; // Загрузка .env должна быть первой
//Настройки сервера:
import app from "./app.js";
//Клиент призмы для взаимодействия с БД:
import { prisma } from "@repo/database";
//Импортируем мой сервис удаления неподтвержденных аккаунтов:
import { CleanupService } from "./modules/identity/auth/cleanup.service.js";
import { connectMongoDB } from "./lib/mongoose.js";
import { initDiscountCron } from "./modules/discount/discount.queue.js";
import { TelegramService } from "./modules/notifications/telegram.service.js";
import { initNotificationListeners } from "./modules/notifications/notification.listener.js";
import { initReportsSchedule } from "./modules/reports/reports.queue.js";
//Воркеры (подключаем, чтобы задачи не просто копились в Redis, а реально выполнялись) (воркеры начнают слушать очередь автоматически при импорте):
import "./modules/ordering/order.worker.js"; //Воркер заказов, чтобы он начал слушать задачи.
import "./modules/discount/discount.worker.js"; //Воркер скидок, чтобы он начал слушать задачи.
import "./modules/identity/auth/cleanup.worker.js"; //Воркер сервиса очистки аккаунтов, чтобы он начал слушать задачи.
import "./modules/reports/reports.worker.js"; //Воркер отчетов.

const PORT = process.env.PORT || 3001;
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function bootstrap() {
  try {
    //1) Пробуем 5 раз подключиться ко всем БД с задержкой 3 сек между попытками:
    let retries = 5;
    while (retries) {
      try {
        // 1.Проверяем соединение с БД:
        console.log("⏳Проверка соединения с PostgreSQL...");
        await prisma.$connect();
        console.log("✅PostgreSQL подключен успешно");

        await connectMongoDB(); //Подключаем MongoDB

        break; // Выходим из цикла, если подключились
      } catch (err) {
        retries -= 1;
        console.error(`Ошибка подключения. Осталось попыток: ${retries}`, err);
        if (retries === 0) process.exit(1);
        await sleep(3000); // Ждем 3 секунды перед следующей попыткой
      }
    }

    //2.Запускаем остальное:
    await initDiscountCron(); //Запускаем планировщик задач для скидок и промокодов

    TelegramService.init(); //Подключаемся к ТГ-боту
    console.log("К ТГ-боту подключение завершено");

    initNotificationListeners(); //Запускаем слушателя событий для сервиса оповещений
    initReportsSchedule(); //Запускаем работу очереди для сервиса отчетов

    await CleanupService.init(); //Запускаем сервис удаления неподтвержденных аккаунтов спустя 7 дней
    console.log("Сервис очистки неподтвержденных аккаунтов запущен");

    //3.Только после успеха запускаем сервер:
    const server = app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    });

    //4. Механизм плавного завершения работы (Graceful Shutdown):
    //(Цель — не просто убить процесс мгновенно, а дать приложению время корректно завершить текущие дела перед выходом).
    //Без этого при каждом перезапуске сервера старые соединения могут «висеть» в PostgreSQL, пока не забьют весь лимит подключений.
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Получен сигнал ${signal}. Начинаем остановку...`);

      // Закрываем HTTP-сервер (перестаем принимать новые запросы):
      server.close(() => {
        console.log("📡 HTTP-сервер остановлен.");
      });

      try {
        // Закрываем соединение с БД:
        await prisma.$disconnect();
        console.log("🔌 Соединение с Prisma закрыто.");

        process.exit(0);
        //Код "0" - работа завершена успешно.
      } catch (err) {
        console.error("❌ Ошибка при закрытии ресурсов:", err);
        process.exit(1);
        //Код "1" - произошла ошибка, и приложение закрылось аварийно.
      }
    };

    //5.Слушаем сигналы прерывания процесса:
    process.on("SIGINT", () => gracefulShutdown("SIGINT")); //"SIGINT" = Нажатие "Ctrl+C" в терминале.
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM")); //"SIGTERM" = Сигнал, который посылает Docker (и Kubernetes) при остановке контейнера. Если сервер его игнорирует, Docker через 10 секунд принудительно «убивает» его (SIGKILL), что может повредить файлы БД.
  } catch (error) {
    console.error("❌ Ошибка при запуске сервера:");
    console.error(error);

    // Если БД не отвечает, останавливаем процесс:
    await prisma.$disconnect();
    process.exit(1);
  }
}

//Непосредственно запуск сервера:
bootstrap();
