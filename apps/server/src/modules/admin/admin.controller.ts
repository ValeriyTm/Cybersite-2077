//--------Этот контроллер будет отвечать за получение списков с пагинацией и поиском.
//Типы:
import { Response } from "express";
import { AuthRequest } from "src/shared/middlewares/auth.middleware.js";
//Главный сервис модуля Admin:
import { adminService } from "./admin.service.js";
//Сервисы модуля Reports:
import { reportsService } from "../reports/index.js";
import { pdfService } from "../reports/index.js";
import { excelService } from "../reports/index.js";
//Поисковый сервис модуля Catalog:
import { searchService } from "../catalog/index.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";

//---------------------Работа с брендами:-------------
// Универсальный метод для получения списка брендов:
export const getBrands = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const { brands, total } = await adminService.getBrands(search, skip, limit);

  res.json({
    data: brands,
    meta: {
      total,
      page: Number(page),
      lastPage: Math.ceil(total / Number(limit)),
    },
  });
});

//Метод для удаления бренда:
export const deleteBrand = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    //Находим все связанные модели мотоциклов перед удалением, а также производим удаление:
    const affectedMotos = await adminService.deleteBrand(id);

    //После удаления бренда и байков (каскадно) — чистим индекс Elastic:
    const deletePromises = affectedMotos.map((m) =>
      searchService.deleteFromIndex(m.id),
    );
    await Promise.all(deletePromises);

    res.json({ message: "Бренд и связанные товары удалены из БД и индекса" });
  },
);

//Метод для создания бренда:
export const createBrand = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { name, country, slug } = req.body;
    const brand = await adminService.createBrand(name, country, slug);

    // При создании нового бренда мотоциклов еще нет,
    // поэтому синхронизация не требуется, пока не создадут первый байк.
    res.status(201).json(brand);
  },
);

//Метод для изменения информации о бренде:
export const updateBrand = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, country, slug } = req.body;

    const brands = await adminService.updateBrand(id, name, country, slug);

    //Если изменился slug или name — синхронизируем все байки этого бренда в Elastic:
    if (
      brands.oldBrand?.slug !== brands.updatedBrand.slug ||
      brands.oldBrand?.name !== brands.updatedBrand.name
    ) {
      //Запускаем в фоне, чтобы не заставлять админа ждать окончания индексации всех байков:
      searchService
        .syncBrandMotorcycles(id)
        .catch((err) =>
          console.error(`Ошибка синхронизации бренда ${id} в ES:`, err),
        );
    }

    res.json(brands.updatedBrand);
  },
);
//---------------------Работа с мотоциклами:-------------
//Метод поиска брендов (нужен для создания новой записи о мотоцикле):
export const searchBrands = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { query } = req.query;

    if (!query || String(query).length < 2) {
      return res.json([]);
    }

    const brands = await adminService.searchBrands(query);

    res.json(brands);
  },
);

//Метод получения информации о всех мотоциклах:
export const getMotorcycles = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10, search = "" } = req.query;
    const p = Number(page);
    const l = Number(limit);
    const searchQuery = String(search).trim();

    let ids: string[] = [];
    let totalCount = 0;

    if (searchQuery.length >= 2) {
      //Elastic должен вернуть ID именно для текущей страницы:
      const esResult = await searchService.searchMotorcyclesAdmin(
        searchQuery,
        p,
        l,
      );
      ids = esResult.ids;
      totalCount = esResult.total;

      if (ids.length === 0) {
        return res.json({
          data: [],
          meta: { total: 0, page: p, lastPage: 0 },
        });
      }

      //Prisma тянет данные только по тем ID, что выдал Elastic для этой страницы:
      const motorcycles = await adminService.getMotorcycles(ids);

      //Сортируем результат Prisma в том порядке, в котором их вернул Elastic (по релевантности):
      const sortedMotorcycles = ids
        .map((id) => motorcycles.find((m) => m.id === id))
        .filter(Boolean);

      return res.json({
        data: sortedMotorcycles,
        meta: {
          total: totalCount,
          page: p,
          lastPage: Math.ceil(totalCount / l),
        },
      });
    }
  },
);

//Метод создания записи о мотоцикле:
export const createMotorcycle = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const data = req.body;
    const files = req.files as Express.Multer.File[];

    const motorcycle = await adminService.createMotorcycle({ data, files });

    //Обновление данных в Elasticsearch:
    await searchService.indexMotorcycle(motorcycle.id);

    res.status(201).json(motorcycle);
  },
);

//Метод изменения записи о мотоцикле:
export const updateMotorcycle = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const {
      id: _, //Извлекаем лишнее
      brand, //Извлекаем лишнее
      createdAt, //Извлекаем лишнее
      updatedAt, //Извлекаем лишнее
      deletedImageIds,
      mainImageId,
      ...rawData
    } = req.body;
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    const motorcycle = await adminService.updateMotorcycle(
      rawData,
      files,
      deletedImageIds,
      mainImageId,
      id,
    );

    //Обновляем данные в Elastic:
    await searchService.indexMotorcycle(id);
    res.json(motorcycle);
  },
);

//Метод удаления записи о мотоцикле:
export const deleteMotorcycle = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await adminService.deleteMotorcycle(id);

    //Удаляем из Elastic
    await searchService.deleteFromIndex(id);
    res.json({ message: "Мотоцикл удален" });
  },
);
//---------------------Работа с остатками:-------------
//Получение всех остатков:
export const getStocks = catchAsync(async (req: AuthRequest, res: Response) => {
  const { motoId } = req.query;

  const stocks = await adminService.getStocks(motoId);

  res.json({ data: stocks });
});

//Обновление остатков:
export const updateStock = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { quantity } = req.body;

    const stock = await adminService.updateStock(id, quantity);

    //Обновление инфы в Elasticsearch:
    searchService.updateStockInElastic(stock.motorcycleId).catch((err) => {
      console.error(
        `Ошибка синхронизации остатков для байка ${stock.motorcycleId}:`,
        err,
      );
    });

    res.json(stock);
  },
);

//---------------------Работа с заказами:-------------
//Получить все заказы:
export const getOrders = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, status, email } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await adminService.getOrders(
    status,
    email,
    skip,
    limit,
  );

  res.json({
    data: orders,
    meta: {
      total,
      page: Number(page),
      lastPage: Math.ceil(total / Number(limit)),
    },
  });
});

//Изменить статус заказа:
export const updateOrderStatus = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const order = await adminService.updateOrderStatus(id, status);

    res.json(order);
  },
);

//---------------------Управление доступом:-------------
//Получить данные о юзерах:
export const getUsers = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, role, email } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await adminService.getUsers(role, email, skip, limit);

  res.json({
    data: users,
    meta: { total, lastPage: Math.ceil(total / Number(limit)) },
  });
});

//Изменить роль юзеру:
export const updateUserRole = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = (req as any).user.id; //ID текущего админа из мидлвара

    //Защита - нельзя менять роль самому себе
    if (id === adminId) {
      return res
        .status(403)
        .json({ message: "Вы не можете изменить роль самому себе" });
    }

    const user = await adminService.updateUserRole(id, role);
    res.json(user);
  },
);

//Удалить юзера:
export const deleteUser = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const adminId = (req as any).user.id;

    if (id === adminId) {
      return res.status(403).json({
        message: "Вы не можете удалить свою собственную учетную запись",
      });
    }

    await adminService.deleteUser(id);

    res.json({ message: "Пользователь успешно удален" });
  },
);
//---------------------Глобальная синхронизация:-------------
//Синхронизируем всю БД с Elasticsearch:
export const globalSearchSync = catchAsync(
  async (req: AuthRequest, res: Response) => {
    //Очищаем индекс в Elasticsearch
    const esUrl = process.env.ELASTICSEARCH_URL || "http://localhost:9200";
    await fetch(`${esUrl}/motorcycles`, {
      method: "DELETE",
    });

    //Вызываем  логику пересоздания индекса и заливки данных
    await searchService.syncAllMotorcycles();

    res.json({ message: "Глобальная синхронизация успешно завершена" });
  },
);
//---------------------Скидки и промокоды:-------------
//Получаем промокоды:
export const getPromoCodes = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const promos = await adminService.getPromoCodes();
    res.json(promos);
  },
);

//Поулчаем персональные скидки:
export const getPersonalDiscounts = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { email } = req.query;

    const discounts = await adminService.getPersonalDiscounts(email);

    res.json(discounts);
  },
);
//---------------------Отчеты:-------------
//Скачать отчеты:
export const downloadSalesReport = catchAsync(
  async (req: AuthRequest, res: Response) => {
    console.log("req.query: ", req.query);
    const { format, days = 30 } = req.query; // Получаем формат (pdf/xlsx) и период
    console.log("Запрошенный формат:", format);
    const stats = await reportsService.getStatistics(Number(days));

    if (format === "xlsx") {
      const filePath = await excelService.generateSalesRepo(stats);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      return res.download(filePath, (err) => {
        if (err) console.error("Ошибка при отправке Excel:", err);
        // Удаляем временный файл после отправки, если нужно
        // fs.unlinkSync(filePath);
      });
    }

    if (format === "pdf") {
      const filePath = await pdfService.generateSalesPdf(stats);
      res.contentType("application/pdf");
      return res.sendFile(filePath);
    }

    res.status(400).json({ message: "Неверный формат отчета" });
  },
);

//---------------------Тикеты поддержки:-------------
//Получение всех тикетов:
export const getTickets = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10, status, email } = req.query;
    const p = Number(page);
    const l = Number(limit);
    const skip = (p - 1) * l;

    const [tickets, total] = await adminService.getTickets(
      status,
      email,
      skip,
      l,
    );

    res.json({
      data: tickets,
      meta: {
        total,
        page: p,
        lastPage: Math.ceil(total / l),
      },
    });
  },
);

//Дать ответ на тикет:
export const replyToTicket = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { answer } = req.body;

    const ticket = await adminService.replyToTicket(id, answer);
    res.json(ticket);
  },
);

//Изменить статус тикета:
export const updateTicketStatus = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = await adminService.updateTicketStatus(id, status);

    res.json(ticket);
  },
);

//---------------------Контент:-------------
//Получить список новостей:
export const getNews = catchAsync(async (req: AuthRequest, res: Response) => {
  const news = await adminService.getNews();
  res.json(news);
});

//Создать новость:
export const createNews = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { title, excerpt, content, status, tags } = req.body;
    const userId = req.user?.id;
    const file = req.file;

    const news = await adminService.createNews(
      title,
      excerpt,
      content,
      status,
      tags,
      file,
      userId,
    );

    res.status(201).json(news);
  },
);

//Обновить новость:
export const updateNews = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { content, ...updateData } = req.body;
    const file = req.file;

    const preparedData = {
      ...updateData,
      content: typeof content === "string" ? JSON.parse(content) : content,
    };

    if (file) preparedData.mainImage = file.filename;

    const updated = await adminService.updateNews(id, preparedData);
    res.json(updated);
  },
);

//Удалить новость:
export const deleteNews = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id;
    await adminService.deleteNews(id);
    res.json({ message: "Новость удалена" });
  },
);

//Изменить статус новости:
export const updateNewsStatus = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const updatedNews = await adminService.updateNewsStatus(id, status);

    if (!updatedNews) {
      throw new AppError(404, "Новость не найдена");
    }

    res.json(updatedNews);
  },
);
