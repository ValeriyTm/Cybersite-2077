/////-----------------------Файл позволяет работать с корневым .env проекта из папки бэкенда----------------////
//Встроенный модуль Node.js для работы с путями файлов и папок:
import path from "node:path";
//Утилита, которая превращает URL-адрес файла (формата file://...) в обычный путь, понятный ОС:
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

//Полный URL текущего скрипта:
const __filename = fileURLToPath(import.meta.url);
//Путь к папке, в которой лежит текущий файл, кроме имени самого файла:
const __dirname = path.dirname(__filename);

//Запускаем dotenv, указывая скрипту путь к .env, лежащему в корне проекта (берем путь текущего скрипта и идём назад на 3 шага):
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
