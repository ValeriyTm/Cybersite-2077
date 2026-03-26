describe("Проверка функционала регистрации", () => {
  const testUser = {
    name: `user${Math.floor(Math.random() * 1000)}`,
    email: `test${Date.now()}@test.com`,
    password: "SafePassword123!",
    confirmPassword: "SafePassword123!",
  };

  beforeEach(() => {
    cy.visit("/auth");
    //Заходим на форму регистрации:
    cy.contains("button", /регистрация/i).click();
  });

  //1) Успешная регистрация:
  it("Тест: успешная регистрация", () => {
    cy.wait(1000); // Даем время скрипту ReCaptcha инициализироваться перед началом тестов

    cy.intercept("POST", "**/identity/auth/register").as("registerReq");
    //Заполняем форму:
    cy.get('input[name="name"]').type(testUser.name);
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('input[name="confirmPassword"]').type(testUser.confirmPassword);
    cy.get('input[name="acceptTerms"]').check({ force: true });
    //Отправка данных:
    cy.get('button[type="submit"]').click();
    //Ждем ответа:
    cy.wait("@registerReq").its("response.statusCode").should("eq", 201);
    //Ждем всплывающее уведомление:
    cy.contains(/проверьте почту|письмо отправлено/i).should("be.visible");
  });

  //2) Попытка залогиниться без подтверждения аккаунта:
  it("Тест: блокировка входа в аккаунт без подтверждения", () => {
    //Переходим на форму логина:
    cy.contains("button", /вход/i).click();
    //Вводим данные:
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();
    //Проверяем, что сервер выдал ошибку активации:
    cy.contains(/аккаунт не активирован/i).should("be.visible");
    cy.url().should("not.include", "/profile");
  });

  //3) Попытка зарегистрироваться с теми же данныеми:
  it("Тест: должны получить ошибку при попытке регистрации дубликата", () => {
    //Заполняем форму:
    cy.get('input[name="name"]').type(testUser.name);
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('input[name="confirmPassword"]').type(testUser.confirmPassword);
    cy.get('input[name="acceptTerms"]').check({ force: true });
    //Отправка данных:
    cy.get('button[type="submit"]').click();
    //Проверяем тост ошибки от сервера:
    cy.contains(/некорректный email или пароль/i).should("be.visible");
  });
});
