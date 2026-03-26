describe("Проверка фунцкионала аутентификации и редактирования профиля", () => {
  beforeEach(() => {
    // Перед каждым тестом заходим на страницу логина
    cy.visit("/auth");
  });

  //Тест №1. Проверяем функционал логина (входим в профиль с корректными данными):
  it("Должно успешно авторизовать пользователя и перенаправить в профиль", () => {
    cy.wait(1000); // Даем время скрипту ReCaptcha инициализироваться перед началом тестов

    //1) Кликаем по тоггл-переключателю "Вход":
    cy.contains("button", /вход/i).click();
    //2) Вводим данные существующего юзера:
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("qqqqqQQQ1!");
    //3) Нажимаем кнопку отправки формы:
    cy.get('button[type="submit"]').click();
    //4) Редирект в профиль:
    //(увеличиваем таймаут, так как серверу нужно время на ответ)
    cy.url({ timeout: 10000 }).should("include", "/profile");
    //5) Проверяем, что мы действительно вошли в профиль:
    //Проверяем "Имя" (это h1) в заголовке (ищем h1 внутри блока с заголовком):
    cy.get("h1").should("be.visible").and("not.be.empty");
    //Проверяем наличие аватара (убеждаемся, что тег img отрендерился и имеет alt-текст):
    cy.get('img[alt="Аватар пользователя"]').should("be.visible");
    //Проверяем роль пользователя
    cy.get("p").should("be.visible").and("not.be.empty");
  });

  //Тест №2. Проверяем функционал логина (входим в профиль с некорректными данными):
  it("Должно показывать ошибку при вводе неверных данных", () => {
    //1) Кликаем по тоггл-переключателю "Вход":
    cy.contains("button", /вход/i).click();
    //2) Вводим заведомо неверные данные:
    cy.get('input[name="email"]').type("wrong@test.com");
    cy.get('input[name="password"]').type("wrong-password-123");
    //3) Нажимаем кнопку отправки формы:
    cy.get('button[type="submit"]').click();

    //4) Ищем toast (React-hot-toast обычно использует роль alert или status):
    cy.get('[role="status"]', { timeout: 10000 })
      .should("be.visible")
      .and("not.be.empty");
  });

  //Тест №3: Редактирование профиля:
  it("Проверка формы редактирования профиля", () => {
    //1) Данные:
    const newName = "CypressTester";

    const birthdayForInput = "20.05.1995"; // Формат ДД.ММ.ГГГГ для маски
    const birthdayForDisplay = "20.05.1995"; //Формат, который получим по итогу

    const phoneForInput = "9991234567"; // Формат, который вводим (вводим без +7, т.к. маска подставит сама)
    const phoneInRequestBody = "+7 (999) 123-45-67"; //Формат, который получим по итогу

    const selectedGender = "MALE"; //Значение value в теге <option>
    const genderLabel = "Мужской"; //Что по итогу получим

    //2) Интерцепторы:
    cy.intercept("PATCH", "**/identity/profile/update").as("updateUser");
    cy.intercept("GET", "**/identity/auth/refresh").as("refreshProfile");

    //3) Авторизуемся в профиль:
    cy.contains("button", /вход/i).click();
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("qqqqqQQQ1!");
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should("include", "/profile");

    //4) Редактируем профиль:
    //Входим в режим редактирования:
    cy.contains("button", /редактировать/i).click();
    //Заполняем имя:
    cy.get('input[name="name"]').clear().type(newName);
    //Заполням дату рождения:
    cy.get('input[placeholder="ДД.ММ.ГГГГ"]').clear().type(birthdayForInput);
    //Заполняем номер телефона:
    cy.contains("div", /телефон/i)
      .parent()
      .find("input")
      .clear()
      .type(phoneForInput);
    //Выбираем пол:
    cy.get('select[name="gender"]').select(selectedGender);
    //Сохраняем изменения:
    cy.contains("button", /сохранить/i).click();

    //5) Сетевые запросы (проверяем, что фронтенд отправил на сервер):
    //Cypress останавливает выполнение теста и ждет, пока браузер выполнит HTTP-запрос, которому ранее был присвоен алиас updateUser (это запрос PATCH на обновление профиля)
    //(без этого тест пошел бы проверять экран еще до того, как сервер успел сохранить данные):
    cy.wait("@updateUser").then((interception) => {
      const body = interception.request.body; //Достаём тело запроса
      //Сравниваем отправленное имя с тем, что ввели в тесте:
      expect(body.name.toLowerCase()).to.equal(newName.toLowerCase());
      //Убеждаемся, что маска IMask правильно отформатировала номер (добавила скобки и тире) перед отправкой:
      expect(body.phone).to.equal(phoneInRequestBody);
      //Проверяем, что в базу ушло правильное значение enum:
      expect(body.gender).to.equal(selectedGender);
    });
    //После того как профиль обновился, перезапрашиваем свежие данные пользователя:
    cy.wait("@refreshProfile");

    //6) Проверяем, что на выходе в профиле отрендерило:
    // Проверяем имя (в h1):
    cy.get("h1").should(($h1) => {
      expect($h1.text().toLowerCase()).to.contain(newName.toLowerCase());
    });
    //Проверяем дату:
    cy.contains(birthdayForDisplay).should("be.visible");
    //Проверяем номер телефона:
    cy.contains(phoneInRequestBody).should("be.visible");
    //Проверяем пол:
    cy.contains(genderLabel).should("be.visible");
    //Проверяем, что появилось уведомление (toast):
    cy.contains("Профиль обновлен").should("be.visible");
  });

  //Тест №4: Загрузка аватара:
  it("Должно успешно загрузить новый аватар", () => {
    // 1. Перехватываем запросы (загрузка и рефетч профиля):
    cy.intercept("POST", "**/identity/profile/avatar").as("uploadAvatar");
    cy.intercept("GET", "**/identity/auth/refresh").as("refreshProfile");

    //2) Авторизация (входим в аккаунт):
    cy.contains("button", /вход/i).click();
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("qqqqqQQQ1!");
    cy.get('button[type="submit"]').click();
    //Ждем перехода в профиль:
    cy.url({ timeout: 10000 }).should("include", "/profile");

    //3) Запоминаем текущий путь к аватарке, чтобы потом сравнить:
    cy.get('img[alt="Аватар пользователя"]')
      .invoke("attr", "src")
      .then((oldSrc) => {
        //Переходим в режим редактирования (чтобы открылся доступ к клику по аватару):
        cy.contains("button", /редактировать/i).click();

        //Выбираем файл. Cypress скормит его скрытому инпуту type="file"
        //Прим: файл cypress/fixtures/avatar.png должен существовать.
        cy.get('input[type="file"]').selectFile("cypress/fixtures/avatar.png", {
          force: true,
        });

        //Ждем сетевой активности:
        cy.wait("@uploadAvatar", { timeout: 15000 });
        cy.wait("@refreshProfile", { timeout: 15000 });

        //Путь к картинке должен измениться:
        cy.get('img[alt="Аватар пользователя"]', { timeout: 10000 })
          .invoke("attr", "src")
          .should("not.eq", oldSrc); // Путь не должен быть равен старому
      });

    //4) Проверяем уведомление
    cy.contains("Аватар обновлен").should("be.visible");
  });

  //Тест №5: Смена пароля:
  it("Должен успешно сменить пароль пользователя", () => {
    //1) Перехватываем запрос на смену пароля 🎯
    cy.intercept("POST", "**/identity/auth/change-password").as(
      "changePassword",
    );

    //2) Авторизация (входим под текущим паролем)^
    cy.contains("button", /вход/i).click();
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("qqqqqQQQ1!");
    cy.get('button[type="submit"]').click();
    //Ждем перехода в профиль:
    cy.url({ timeout: 10000 }).should("include", "/profile");

    //3) Находим заголовок или блок смены пароля (жмем кнопку "Редактировать"):
    cy.contains("button", /редактировать/i).click();

    //4) Заполняем поля смены пароля:
    //(имена инпутов должны совпадать с ChangePasswordSchema)
    cy.get('input[name="oldPassword"]').type("qqqqqQQQ1!");
    cy.get('input[name="newPassword"]').type("qqqqqQQQ1!");
    cy.get('input[name="confirmPassword"]').type("qqqqqQQQ1!");

    //5) Нажимаем кнопку смены пароля:
    cy.contains("button", /обновить пароль/i).click();

    //6) Ждем ответа сервера:
    cy.wait("@changePassword");

    //7) Проверяем появление тоста успеха:
    cy.contains("Пароль успешно изменен").should("be.visible");

    //8) Проверяем, что поля очистились :
    cy.get('input[name="oldPassword"]').should("have.value", "");
  });

  //Тест №6: Выход из текущей сессии:
  it("Должен выйти из текущей сессии и очистить данные", () => {
    //1) Перехватываем запрос на логаут:
    cy.intercept("POST", "**/identity/auth/logout").as("logoutRequest");

    //2) Входим:
    cy.contains("button", /вход/i).click();
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("qqqqqQQQ1!");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/profile");

    //3) Нажимаем кнопку "Выйти":
    cy.contains("button", /выйти из аккаунта/i).click();

    //4) Ждем ответа сервера:
    cy.wait("@logoutRequest");

    //5) ПРоверяем, что произошел редиреккт:
    cy.url().should("include", "/auth");

    //6) Проверяем, что в localStorage флаг isAuth стал false:
    cy.window().then((win) => {
      const store = JSON.parse(
        win.localStorage.getItem("auth-storage") || "{}",
      );
      expect(store.state.isAuth).to.be.false;
      expect(store.state.accessToken).to.be.null;
    });
  });

  //Тест №7: Выход из всех сессий:
  it("Должен выйти со всех устройств", () => {
    //1) Перехватываем запрос:
    cy.intercept("POST", "**/identity/auth/logout-all").as("logoutAllRequest");

    //2) Входим:
    cy.contains("button", /вход/i).click();
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("qqqqqQQQ1!");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/profile");

    //3) Ищем кнопку "Выйти со всех устройств":
    cy.contains("button", /выйти со всех устройств/i).click();

    //4) Ждем подтверждения от сервера
    cy.wait("@logoutAllRequest");

    //5) Проверяем, что произошел редирект:
    cy.url().should("include", "/auth");

    //6) Проверяем, что в localStorage флаг isAuth стал false:
    cy.window().then((win) => {
      const store = JSON.parse(
        win.localStorage.getItem("auth-storage") || "{}",
      );
      expect(store.state.isAuth).to.be.false;
      expect(store.state.accessToken).to.be.null;
    });
  });

  //Раскомментировать, если нужно проверить функционал удаления аккаунта:

  //Тест №8: Удаление аккаунта:
  //   it("Должно успешно удалить аккаунт и разлогинить пользователя", () => {
  //     //1) Перехватываем запрос на удаление:
  //     cy.intercept("DELETE", "**/identity/auth/delete-account").as(
  //       "deleteAccount",
  //     );
  //     //2) Перехватываем выход из системы:
  //     cy.intercept("POST", "**/identity/auth/logout").as("logoutRequest");

  //     //3) Авторизация
  //     cy.contains("button", /вход/i).click();
  //     cy.get('input[name="email"]').type("test@example.com");
  //     cy.get('input[name="password"]').type("qqqqqQQQ1!");
  //     cy.get('button[type="submit"]').click();
  //     // Ждем перехода в профиль:
  //     cy.url({ timeout: 10000 }).should("include", "/profile");

  //     //4) Ищем кнопку удаления:
  //     cy.contains("button", /удалить аккаунт/i).click();

  //     //5) Ищем модалку по заголовку и ограничиваем поиск внутри неё
  //     cy.contains("h2", "Удаление аккаунта")
  //       .closest('div[class*="modal"]') // Находим ближайший div с классом модалки
  //       .within(() => {
  //         //Теперь Cypress "видит" только те элементы, что в этом окне
  //         //Вводим пароль:
  //         cy.get('input[name="confirmPassword"]').type("qqqqqQQQ1!");

  //         //Нажимаем кнопку отправки формы (Submit)
  //         cy.get('button[type="submit"]').click();
  //       });

  //     //6) Ждем сетевой активности
  //     cy.wait("@deleteAccount", { timeout: 10000 });
  //     cy.wait("@logoutRequest", { timeout: 10000 });

  //     //7) Робот должен оказаться на странице авторизации
  //     cy.url().should("include", "/auth");

  //     //8) Проверяем, что в localStorage больше нет токена (Пункт 6.1 / 7.1)
  //     cy.window().then((win) => {
  //       expect(win.localStorage.getItem("auth-storage")).to.contain(
  //         '"isAuth":false',
  //       );
  //     });

  //     //9) Видим прощальный тост
  //     cy.contains("Ваш аккаунт удален").should("be.visible");
  //   });

  //Тест №9: Сброс пароля (этап получения ссылки на почту):
  it("Тест №9 (Пункт 3.3): должен отправить инструкции по сбросу пароля на почту", () => {
    //1) Перехватываем запрос на восстановление:
    cy.intercept("POST", "**/identity/auth/forgot-password").as(
      "forgotPasswordReq",
    );

    //1) Кликаем по тоггл-переключателю "Вход":
    cy.contains("button", /вход/i).click();

    //2) Находим и кликаем по ссылке "Забыли пароль?"
    cy.contains(/забыли пароль/i).click();

    //3) Вводим email пользователя:
    cy.get('input[name="email"]').type("test@example.com");

    //4) Ждем инициализации ReCaptcha (чтобы не было ошибки "Защита не готова"):
    cy.get(".grecaptcha-badge", { timeout: 10000 }).should("exist");

    //5)Отправляем форму:
    cy.get('button[type="submit"]').click();

    //6) Ждем ответа сервера:
    cy.wait("@forgotPasswordReq").its("response.statusCode").should("eq", 200);

    //7) Должен появиться тост, что письмо отправлено:
    cy.contains(/письмо со ссылкой отправлено/i).should("be.visible");
  });
});
