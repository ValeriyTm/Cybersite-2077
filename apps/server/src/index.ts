//Тут только запуск сервера
import "./shared/env"; // Загрузка .env должна быть первой
import app from "./app.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server started on http://localhost:${PORT}`);
});
