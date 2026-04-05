//----------Тут только запуск сервера
//Подключаем .env корневого проекта:
import "./shared/env"; // Загрузка .env должна быть первой
//Настройки сервера:
import app from "./app.js";
//Клиент призмы для взаимодействия с БД:
import { prisma } from "@repo/database";
//Импортируем мой сервис удаления неподтвержденных аккаунтов:
import { CleanupService } from "./modules/identity/auth/cleanup.service.js";
import { connectMongoDB } from "./lib/mongoose.js";

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  try {
    // 1.Проверяем соединение с БД:
    console.log("⏳Проверка соединения с PostgreSQL...");
    await prisma.$connect();
    console.log("✅PostgreSQL подключен успешно");

    await connectMongoDB(); //Подключаем MongoDB

    // 2.Только после успеха запускаем сервер:
    const server = app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);

      //Запускаем планировщик задач сразу после старта сервера:
      CleanupService.init();
      console.log(
        "🧹 Cleanup Service: Scheduled task for unactivated users initialized",
      );
    });

    //3. Механизм плавного завершения работы (Graceful Shutdown):
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

    //4.Слушаем сигналы прерывания процесса:
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
