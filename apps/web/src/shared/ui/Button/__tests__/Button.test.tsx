/**
 * @jest-environment jsdom
 */
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { Button } from "../Button";

expect.extend(matchers);
//Без "matchers" expect умеет только сравнивать числа или строки.
//С ними он понимает, что такое «заблокированная кнопка» или «текст внутри тега».
//Другими словами, помещаем стандартные проверки для браузера в стандартную функцию expect.

afterEach(() => {
  cleanup();
  //После каждого теста (it) полностью очищается виртуальная страница.
});

describe("Тест компонента Button", () => {
  it("Состояние загрузки - должен отображаться текст загрузки; состояние должно быть заблокированным", () => {
    //Производим отрисовку компонента кнопки в памяти (в jsdom):
    render(
      <Button isLoading={true} loadingText="Входим...">
        Войти
      </Button>,
    );

    //Ищем кнопку, на которой написано "Входим...":
    const button = screen.getByRole("button", { name: /входим\.\.\./i });
    //Проверка состояния: кнопка должна быть заблокирована:
    expect(button).toBeDisabled();
    //Текст должен быть "Входим...":
    expect(button).toHaveTextContent("Входим...");
  });

  it("Обычно состояние - должен отображаться текст кнопки; состояние должно не быть заблокированным", () => {
    //Производим отрисовку компонента кнопки в памяти (в jsdom):
    render(<Button isLoading={false}>Войти</Button>);
    //Ищем кнопку, на которой написано "Войти":
    const button = screen.getByRole("button", { name: /войти/i });
    //Проверка состояния: кнопка не должна быть заблокирована:
    expect(button).not.toBeDisabled();
    //Текст должен быть "Войти":
    expect(button).toHaveTextContent("Войти");
  });
});
