import "./commands";

Cypress.on("uncaught:exception", (err) => {
  //Игнорируем ошибки Axios с кодами 400, 401 и 403 (чтобы от ошибок, выкидываемых сервером фронтенду для выведения уведомлений, тесты Cypress не падали):
  if (
    err.message.includes("400") ||
    err.message.includes("401") ||
    err.message.includes("403") ||
    err.message.includes("AxiosError")
  ) {
    return false;
  }
  //Для всех остальных ошибок оставляем стандартное поведение:
  return true;
});
