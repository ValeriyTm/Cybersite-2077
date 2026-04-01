describe("Модуль Trading", () => {
  beforeEach(() => {
    //---------1.Авторизация:------------
    cy.wait(2000);
    cy.visit("/auth");
    cy.wait(2000); // Даем время скрипту ReCaptcha инициализироваться перед началом тестов
    //Кликаем по тоггл-переключателю "Вход":
    cy.contains("button", /вход/i).click();
    //Вводим данные существующего юзера:
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("qqqqqQQQ1!");
    //Нажимаем кнопку отправки формы:
    cy.get('form button[type="submit"]').contains("Войти").click();

    //Редирект в профиль:
    //(увеличиваем таймаут, так как серверу нужно время на ответ)
    cy.url({ timeout: 10000 }).should("include", "/profile");
    //---------2.Переход на страницу товара:---------
    cy.visit("/catalog/motorcycles/yamaha/yamaha-yzf-1000-r11998");
  });

  it("Должен добавиться товар в корзину и обновиться счетчик в хедере", () => {
    //1) Жмем "В корзину"
    cy.get("button").contains("В корзину").click();

    cy.wait(2000);

    //2) Проверяем, что кнопка сменилась на счетчик:
    cy.get('[class*="count"]').should("contain", "1");

    //3) Проверяем счетчик в хедере - ищем иконку корзины со счетчиком
    cy.get("header").find('[class*="counter"]').should("contain", "1");

    //4) Переходим в корзину и проверяем "итоговую сумму":
    cy.get("header").find('a[href="/cart"]').click();
    cy.url().should("include", "/cart");
    cy.get('[class*="total"]').should("not.contain", "0 ₽");
  });
});
