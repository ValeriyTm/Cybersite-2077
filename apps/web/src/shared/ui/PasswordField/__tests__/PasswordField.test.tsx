/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PasswordField } from "../PasswordField";
import { useForm } from "react-hook-form";

//Вспомогательный компонент-обертка, т.к. PasswordField требует 'registration' из useForm:
const TestWrapper = () => {
  const { register } = useForm();
  return <PasswordField label="Пароль" registration={register("password")} />;
};

describe("Компонент PasswordField", () => {
  it("Тест должен переключать тип инпута с password на text при клике на иконку глаза", () => {
    render(<TestWrapper />);

    const input = screen.getByPlaceholderText("••••••••") as HTMLInputElement;
    const button = screen.getByRole("button");

    //По умолчанию тип "password":
    expect(input.type).toBe("password");
    //Кликаем по глазу:
    fireEvent.click(button);
    //Тип должен стать "text":
    expect(input.type).toBe("text");
    //Кликаем еще раз и тип должен стать "password":
    fireEvent.click(button);
    expect(input.type).toBe("password");
  });
});
