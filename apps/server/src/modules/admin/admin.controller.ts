//--------Этот контроллер будет отвечать за получение списков с пагинацией и поиском.
//Типы:
import { raw, Response } from "express";
import { AuthRequest } from "../../shared/middlewares/authMiddleware.js";
import {
  BrandsAdminArgs,
  ChangeOrderStatusAdminBodyArgs,
  ChangeOrderStatusAdminParamsArgs,
  ChangeStatusOfTicketAdminBodyArgs,
  ChangeStatusOfTicketAdminParamsArgs,
  CreateBrandAdminArgs,
  CreateNewsArgs,
  DeleteBrandAdminParamArgs,
  DeleteMotoAdminArgs,
  DeleteNewsArgs,
  GetOrdersAdminArgs,
  GetPersonalDiscountsArgs,
  GetReportsAdminArgs,
  GetTicketsAdminArgs,
  MotosAdminArgs,
  ReplyOnTicketAdminBodyArgs,
  ReplyOnTicketAdminParamsArgs,
  SearchBrandsAdminArgs,
  StocksAdminArgs,
  StocksUpdateAdminBodyArgs,
  StocksUpdateAdminParamsArgs,
  UpdateBrandAdminBodyArgs,
  UpdateBrandAdminParamArgs,
  updateMotoAdminBodyArgs,
  updateMotoAdminParamsArgs,
  UpdateNewsBodyArgs,
  UpdateNewsParamsArgs,
  UpdateStatusNewsBodyArgs,
  UpdateStatusNewsParamsArgs,
} from "@repo/validation";
import { Statistics } from "../reports/types.js";
//Главный сервис модуля Admin:
import { adminService } from "./admin.service.js";
//Сервисы модуля Reports:
import { reportsService } from "../reports/index.js";
import { pdfService } from "../reports/index.js";
import { excelService } from "../reports/index.js";
//Поисковый сервис модуля Catalog:
import { searchService } from "../catalog/index.js";
//Главный сервис модуля Support:
import { supportService } from "../support/index.js";
//Главный сервис модуля Catalog:
import { catalogService } from "../catalog/index.js";
//Главный сервис модуля Ordering:
import { orderService } from "../ordering/index.js";
//Главный сервис модуля Discount:
import { discountService } from "../discount/index.js";
//Главный сервис модуля Content:
import { newsService } from "../content/index.js";
//Используем функцию-обертку catchAsync, чтобы не писать везде "try...catch":
import { catchAsync } from "../../shared/utils/catch-async.js";
//Используем свой класс для выбрасывания ошибок:
import { AppError } from "../../shared/utils/app-error.js";

type ContentFull = UpdateNewsBodyArgs & {
  mainImage?: string;
};

//---------------------Работа с брендами:-------------
//Метод для получения списка брендов:
export const getBrands = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit, search = "" } = req.query as unknown as BrandsAdminArgs;
  const skip = (Number(page) - 1) * Number(limit);

  const { brands, total } = await catalogService.getBrandsAdmin(
    search,
    skip,
    limit,
  );

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
    const { id } = req.params as DeleteBrandAdminParamArgs;

    //Находим все связанные модели мотоциклов перед удалением, а также производим удаление:
    //@ts-ignore:
    const affectedMotos = await catalogService.deleteBrand(id);

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
    const { name, country, slug } = req.body as CreateBrandAdminArgs;
    const brand = await catalogService.createBrand(name, country, slug);

    // При создании нового бренда мотоциклов еще нет,
    // поэтому синхронизация не требуется, пока не создадут первый байк.
    res.status(201).json(brand);
  },
);

//Метод для изменения информации о бренде:
export const updateBrand = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as UpdateBrandAdminParamArgs;
    const { name, country, slug } = req.body as UpdateBrandAdminBodyArgs;

    const brands = await catalogService.updateBrand(id, name, country, slug);

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
//Метод поиска брендов (нужен для создания новой записи о мотоцикле; в поле выбора бренда автоматический поиск):
export const searchBrands = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { query } = req.query as unknown as SearchBrandsAdminArgs;

    if (!query || String(query).length < 2) {
      return res.json([]);
    }

    const brands = await catalogService.searchBrands(query);

    res.json(brands);
  },
);

//Метод получения информации о всех мотоциклах:
export const getMotorcycles = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = "",
    } = req.query as unknown as MotosAdminArgs;
    const searchQuery = String(search).trim();

    let ids: string[] = [];
    let totalCount = 0;

    if (searchQuery.length >= 2) {
      //Elastic должен вернуть ID именно для текущей страницы:
      const esResult = await searchService.searchMotorcyclesAdmin(
        searchQuery,
        page,
        limit,
      );
      ids = esResult.ids;
      totalCount = esResult.total;

      if (ids.length === 0) {
        return res.json({
          data: [],
          meta: { total: 0, page, lastPage: 0 },
        });
      }

      //Prisma тянет данные только по тем ID, что выдал Elastic для этой страницы:
      const motorcycles = await catalogService.getMotorcycles(ids);

      //Сортируем результат Prisma в том порядке, в котором их вернул Elastic (по релевантности):
      const sortedMotorcycles = ids
        .map((id) => motorcycles.find((m) => m.id === id))
        .filter(Boolean);

      return res.json({
        data: sortedMotorcycles,
        meta: {
          total: totalCount,
          page,
          lastPage: Math.ceil(totalCount / limit),
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

    const motorcycle = await catalogService.createMotorcycle(data, files);

    //Обновление данных в Elasticsearch:
    await searchService.indexMotorcycle(motorcycle.id);

    res.status(201).json(motorcycle);
  },
);

//Метод изменения записи о мотоцикле:
export const updateMotorcycle = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const data = req.body as unknown as updateMotoAdminBodyArgs;
    const { id } = req.params as unknown as updateMotoAdminParamsArgs;
    const files = req.files as Express.Multer.File[];

    const motorcycle = await catalogService.updateMotorcycle(data, files, id);

    //Обновляем данные в Elastic:
    await searchService.indexMotorcycle(id);
    res.json(motorcycle);
  },
);

//Метод удаления записи о мотоцикле:
export const deleteMotorcycle = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as unknown as DeleteMotoAdminArgs;
    await catalogService.deleteMotorcycle(id);

    //Удаляем из Elastic
    await searchService.deleteFromIndex(id);
    res.json({ message: "Мотоцикл удален" });
  },
);
//---------------------Работа с остатками:-------------
//Получение всех остатков:
export const getStocks = catchAsync(async (req: AuthRequest, res: Response) => {
  const { motoId } = req.query as StocksAdminArgs;

  const stocks = await adminService.getStocks(motoId);

  res.json({ data: stocks });
});

//Обновление остатков:
export const updateStock = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as StocksUpdateAdminParamsArgs;
    const { quantity } = req.body as StocksUpdateAdminBodyArgs;

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
  const { page, limit, status, email } =
    req.query as unknown as GetOrdersAdminArgs;
  const skip = (page - 1) * limit;

  const [orders, total] = await orderService.getOrders(
    skip,
    limit,
    status,
    email,
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
    const { id } = req.params as unknown as ChangeOrderStatusAdminParamsArgs;
    const { status } = req.body as ChangeOrderStatusAdminBodyArgs;

    const order = await orderService.updateOrderStatus(id, status);

    res.json(order);
  },
);

//---------------------Управление доступом:-------------
//Получить данные о юзерах:
export const getUsers = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, role, email } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  //@ts-ignore:
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

    //@ts-ignore:
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

    //@ts-ignore:
    await adminService.deleteUser(id);

    res.json({ message: "Пользователь успешно удален" });
  },
);
//---------------------Глобальная синхронизация:-------------
//Синхронизируем всю БД с Elasticsearch:
export const globalSearchSync = catchAsync(
  async (_req: AuthRequest, res: Response) => {
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
  async (_req: AuthRequest, res: Response) => {
    const promos = await discountService.getPromoCodes();
    res.json(promos);
  },
);

//Поулчаем персональные скидки:
export const getPersonalDiscounts = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { email } = req.query as GetPersonalDiscountsArgs;

    const discounts = await discountService.getPersonalDiscounts(email);

    res.json(discounts);
  },
);

//---------------------Отчеты:-------------
//Скачать отчеты:
export const downloadSalesReport = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { format, days = 30 } = req.query as unknown as GetReportsAdminArgs; // Получаем формат (pdf/xlsx) и период

    const stats = (await reportsService.getStatistics(days)) as Statistics;

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
    const {
      page = 1,
      limit = 10,
      status = "",
      email = "",
    } = req.query as unknown as GetTicketsAdminArgs;
    const skip = (page - 1) * limit;

    const [tickets, total] = await supportService.getTickets(
      skip,
      limit,
      status,
      email,
    );

    res.json({
      data: tickets,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    });
  },
);

//Дать ответ на тикет:
export const replyToTicket = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as ReplyOnTicketAdminParamsArgs;
    const { answer } = req.body as ReplyOnTicketAdminBodyArgs;

    const ticket = await supportService.replyToTicket(id, answer);
    res.json(ticket);
  },
);

//Изменить статус тикета:
export const updateTicketStatus = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as ChangeStatusOfTicketAdminParamsArgs;
    const { status } = req.body as ChangeStatusOfTicketAdminBodyArgs;

    const ticket = await supportService.updateTicketStatus(id, status);

    res.json(ticket);
  },
);

//---------------------Контент:-------------
//Получить список новостей:
export const getNews = catchAsync(async (_req: AuthRequest, res: Response) => {
  const news = await newsService.getNews();
  res.json(news);
});

//Создать новость:
export const createNews = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { title, excerpt, content, status, tags } =
      req.body as CreateNewsArgs;
    const userId = req.user?.id;
    const file = req.file;

    const news = await newsService.createNews({
      title,
      excerpt,
      content,
      status,
      file,
      tags,
      userId,
    });

    res.status(201).json(news);
  },
);

//Изменить новость:
export const updateNews = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as UpdateNewsParamsArgs;
    const { content, ...updateData } = req.body as UpdateNewsBodyArgs;
    const file = req.file;

    const preparedData: ContentFull = {
      ...updateData,
      content: typeof content === "string" ? JSON.parse(content) : content,
    };

    if (file) preparedData.mainImage = file.filename;

    const updated = await newsService.updateNews(id, preparedData);
    res.json(updated);
  },
);

//Удалить новость:
export const deleteNews = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as DeleteNewsArgs;

    await newsService.deleteNews(id);
    res.json({ message: "Новость удалена" });
  },
);

//Изменить статус новости:
export const updateNewsStatus = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params as UpdateStatusNewsParamsArgs;
    const { status } = req.body as UpdateStatusNewsBodyArgs;

    const updatedNews = await newsService.updateNewsStatus(id, status);

    if (!updatedNews) {
      throw new AppError(404, "Новость не найдена");
    }

    res.json(updatedNews);
  },
);
