//Клиент призмы для работы с PostgreSQL:
import { prisma } from "@repo/database";

const BASE_URL = "https://cybersite2077.online";

export class SitemapService {
  //Переменные для хранения кэша:
  private cachedXml: string | null = null;
  private lastGenerated: number = 0;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; //Время жизни кэша — 24 часа

  async generateSitemapXml(): Promise<string> {
    const now = Date.now();

    //Проверяем, есть ли живой кэш в памяти:
    if (this.cachedXml && now - this.lastGenerated < this.CACHE_TTL) {
      return this.cachedXml; //Если есть, то возвращаем
    }

    const motorcycles = await prisma.motorcycle.findMany({
      select: {
        slug: true,
        updatedAt: true,
        brand: {
          select: { slug: true },
        },
      },
    });

    const urls: string[] = [];

    //Статические ссылки:
    urls.push(`<url><loc>${BASE_URL}/</loc><priority>1.0</priority></url>`);
    urls.push(
      `<url><loc>${BASE_URL}/catalog/brands</loc><priority>0.9</priority></url>`,
    );

    //Динамические ссылки для всех моделей:
    motorcycles.forEach((m) => {
      //Используем слаг из вложенного объекта brand:
      const bSlug = m.brand?.slug || "unknown";
      const lastMod = m.updatedAt
        ? m.updatedAt.toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      urls.push(`
                <url>
                <loc>${BASE_URL}/catalog/motorcycles/${bSlug}/${m.slug}</loc>
                <lastmod>${lastMod}</lastmod>
                <changefreq>monthly</changefreq>
                <priority>0.7</priority>
                </url>
                `);
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
                 <urlset xmlns="http://sitemaps.org">
                 ${urls.join("")}
                 </urlset>`;

    //Записываем результат в кэш и обновляем время:
    this.cachedXml = xml;
    this.lastGenerated = now;

    return xml;
  }
}

export const sitemapService = new SitemapService();
