export const STATUS_OPTIONS = [
  { value: "", label: "Все статусы" },
  { value: "PENDING", label: "Ждем оплаты" },
  { value: "PAID", label: "Оплачены" },
  { value: "CANCELED", label: "Отменены" },
  { value: "DELIVERY", label: "Доставляются" },
  { value: "DELIVERED", label: "Доставлены" },
  { value: "COMPLETED", label: "Завершены" },
];

export const STATUS_SINGLE_OPTIONS = [
  { value: "PENDING", label: "Не оплачен" },
  { value: "PAID", label: "Оплачен" },
  { value: "CANCELED", label: "Отменен" },
  { value: "DELIVERY", label: "В доставке" },
  { value: "DELIVERED", label: "Доставлен" },
  { value: "COMPLETED", label: "Завершен" },
];
