import { prisma } from "@repo/database";

const BASE_URL = "https://cybersite2077.com"; //Мой будущий домен тут будет

export class SitemapService {
  async generateSitemapXml() {
    // 1. Получаем данные, заходя в связанную модель Brand 🎯
    const motorcycles = await prisma.motorcycle.findMany({
      select: {
        slug: true,
        updatedAt: true,
        brand: {
          // 🎯 Достаем слаг через связь
          select: { slug: true },
        },
      },
    });

    // const BASE_URL = "https://cyberbike.com";
    const urls: string[] = [];

    // Статические ссылки
    urls.push(`<url><loc>${BASE_URL}/</loc><priority>1.0</priority></url>`);
    urls.push(
      `<url><loc>${BASE_URL}/catalog/brands</loc><priority>0.9</priority></url>`,
    );

    // Динамические ссылки для 34 000 моделей
    motorcycles.forEach((m) => {
      // 🛡️ Защита: используем слаг из вложенного объекта brand
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
  </url>`);
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://sitemaps.org">
${urls.join("")}
</urlset>`;
  }
}

export const sitemapService = new SitemapService();
