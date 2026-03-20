//Тут только запуск сервера
import "./shared/env"; // Загрузка .env должна быть первой
import app from "./app.js";
//Импортируем мой сервис удаления неподтвержденных аккаунтов:
import { CleanupService } from "./modules/identity/auth/cleanup.service.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);

  //Запускаем планировщик задач сразу после старта сервера:
  CleanupService.init();
  console.log(
    "🧹 Cleanup Service: Scheduled task for unactivated users initialized",
  );
});
