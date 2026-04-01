import { renderHook, act } from "@testing-library/react";
import { MemoryRouter, useSearchParams } from "react-router";
import { useMotorcycleFilters } from "./useMotorcycleFilters";
import { describe, it, expect } from "vitest";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/catalog/motorcycles/yamaha"]}>
    {children}
  </MemoryRouter>
);

describe("useMotorcycleFilters", () => {
  it("Должна корректно обновляться страница в URL", () => {
    const { result } = renderHook(() => useMotorcycleFilters(), { wrapper });

    act(() => {
      result.current.updateFilters({ page: 2 });
    });

    expect(result.current.filters.page).toBe(2);
  });

  it("Должна сбрасываться страницу на первую при изменении поиска", () => {
    const { result } = renderHook(() => useMotorcycleFilters(), { wrapper });

    //Сначала ставим 5 страницу:
    act(() => {
      result.current.updateFilters({ page: 5 });
    });

    //Вводим запрос в поиск:
    act(() => {
      result.current.updateFilters({ search: "ninja" });
    });

    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.search).toBe("ninja");
  });
});
