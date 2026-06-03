import {
  FaMotorcycle,
  FaBoxOpen,
  FaShoppingCart,
  FaQuestionCircle,
  FaPercentage,
  FaFileAlt,
  FaUsersCog,
  FaChartBar,
  FaNewspaper,
} from "react-icons/fa";

export const ADMIN_MENU = [
  {
    group: "Работа с каталогом",
    items: [
      {
        name: "Бренды",
        link: "/admin/brands",
        icon: FaBoxOpen,
        roles: ["MANAGER", "ADMIN", "SUPERADMIN", "WATCHER"],
      },
      { name: "Мотоциклы", link: "/admin/motorcycles", icon: FaMotorcycle },
      {
        name: "Склады и наличие",
        link: "/admin/stocks",
        icon: FaBoxOpen,
        roles: ["MANAGER", "ADMIN", "SUPERADMIN", "WATCHER"],
      },
    ],
  },
  {
    group: "Заказы",
    items: [
      {
        name: "Все заказы",
        link: "/admin/orders",
        icon: FaShoppingCart,
        roles: ["MANAGER", "ADMIN", "SUPERADMIN", "WATCHER"],
      },
    ],
  },
  {
    group: "Вопросы пользователей",
    items: [
      {
        name: "Тикеты саппорта",
        link: "/admin/tickets",
        icon: FaQuestionCircle,
        roles: ["MANAGER", "ADMIN", "SUPERADMIN", "WATCHER"],
      },
    ],
  },
  {
    group: "Маркетинг и аналитика",
    items: [
      {
        name: "Скидки",
        link: "/admin/discounts",
        icon: FaPercentage,
        roles: ["MANAGER", "ADMIN", "SUPERADMIN", "WATCHER"],
      },
      {
        name: "Отчеты",
        link: "/admin/reports",
        icon: FaFileAlt,
        roles: ["MANAGER", "ADMIN", "SUPERADMIN", "WATCHER"],
      },
    ],
  },
  {
    group: "Техническое обслуживание",
    items: [
      {
        name: "Техническое обслуживание",
        link: "/admin/stats",
        icon: FaChartBar,
        roles: ["ADMIN", "SUPERADMIN"],
      },
    ],
  },
  {
    group: "Контент",
    items: [
      {
        name: "Новости",
        link: "/admin/news",
        icon: FaNewspaper,
        roles: ["CONTENT_EDITOR", "ADMIN", "SUPERADMIN", "WATCHER"],
      },
    ],
  },
  {
    group: "Управление доступом",
    items: [
      {
        name: "Пользователи",
        link: "/admin/users",
        icon: FaUsersCog,
        roles: ["SUPERADMIN"],
      },
    ],
  },
];
