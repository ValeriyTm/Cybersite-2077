import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

export class PdfService {
  static async generateSalesPdf(stats: any): Promise<string> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    //Верстка отчета:
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #fff; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #f39c12; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
            .stat-card { border: 1px solid #eee; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 20px; font-weight: 900; color: #f39c12; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8f9fa; text-align: left; padding: 12px; border-bottom: 2px solid #eee; }
            td { padding: 12px; border-bottom: 1px solid #eee; }
            .footer { margin-top: 50px; font-size: 12px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Отчет по продажам на CyberSite-2077</div>
            <div>Период: последние ${stats.period} дней</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div>Выручка</div>
              <div class="stat-value">${stats.totalRevenue.toLocaleString()} ₽</div>
            </div>
            <div class="stat-card">
              <div>Заказов</div>
              <div class="stat-value">${stats.ordersCount}</div>
            </div>
            <div class="stat-card">
              <div>Моделей в топе</div>
              <div class="stat-value">5</div>
            </div>
          </div>

          <h3>🔥 ТОП-5 ПРОДАВАЕМЫХ МОДЕЛЕЙ</h3>
          <table>
            <thead>
              <tr><th>Модель</th><th>Кол-во</th></tr>
            </thead>
            <tbody>
              ${stats.topSellers.map((s: any) => `<tr><td>${s.model}</td><td>${s.quantity} шт.</td></tr>`).join("")}
            </tbody>
          </table>

          <div class="footer">Сгенерировано автоматически системой CyberSite-2077 © ${new Date().getFullYear()}</div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent);

    const reportsDir = path.resolve("uploads/reports");
    if (!fs.existsSync(reportsDir))
      fs.mkdirSync(reportsDir, { recursive: true });

    const fileName = `report-${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    //Генерируем PDF:
    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    });

    await browser.close();
    return filePath;
  }
}
