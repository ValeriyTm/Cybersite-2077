//Библиотека дял работы с .xlsx:
import ExcelJS from "exceljs";
//Для взаимодействия с файлами и путями:
import path from "path";
import fs from "fs";

export class ExcelService {
  async generateSalesRepo(stats: any): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CyberSite Admin";

    //1) Лист "Общая статистика":
    const sheet1 = workbook.addWorksheet("Итоги");
    sheet1.columns = [
      { header: "Показатель", key: "label", width: 30 },
      { header: "Значение", key: "value", width: 25 },
    ];

    sheet1.addRows([
      { label: "Период (дней)", value: stats.period },
      { label: "Всего заказов (оплачено)", value: stats.ordersCount },
      {
        label: "Общая выручка",
        value: `${stats.totalRevenue.toLocaleString()} ₽`,
      },
    ]);

    //Стилизуем заголовок:
    sheet1.getRow(1).font = { bold: true };

    //2) Лист "Топ продаж":
    const sheet2 = workbook.addWorksheet("Топ Моделей");
    sheet2.columns = [
      { header: "Модель мотоцикла", key: "model", width: 40 },
      { header: "Продано (шт)", key: "quantity", width: 15 },
    ];
    sheet2.addRows(stats.topSellers);
    sheet2.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF39C12" },
    };

    //3) Лист "Критические остатки":
    const sheet3 = workbook.addWorksheet("Склад (Внимание)");
    sheet3.columns = [
      { header: "ID", key: "id", width: 15 },
      { header: "Модель", key: "model", width: 30 },
      { header: "Остаток", key: "qty", width: 10 },
      { header: "Склад", key: "wh", width: 20 },
    ];

    stats.lowStock.forEach((s: any) => {
      sheet3.addRow({
        id: s.motorcycleId,
        model: s.motorcycle.model,
        qty: s.quantity,
        wh: s.warehouse.name,
      });
    });

    //4) Сохраняем файл во временную папку:
    const reportsDir = path.resolve("uploads/reports");
    if (!fs.existsSync(reportsDir))
      fs.mkdirSync(reportsDir, { recursive: true });

    const fileName = `report-${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }
}

export const excelService = new ExcelService();
