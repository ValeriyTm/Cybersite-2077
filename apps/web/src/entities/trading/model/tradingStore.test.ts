import { describe, it, expect, beforeEach } from "vitest";
import { useTradingStore } from "./tradingStore";

describe("TradingStore", () => {
  beforeEach(() => {
    useTradingStore.getState().clearTrading();
  });

  it("Должно увеличиваться количество товара, если товар уже в корзине", () => {
    const moto = {
      id: "1",
      model: "Yamaha",
      price: 1000,
      image: "",
      brandSlug: "yamaha",
      quantity: 1,
      slug: "yamaha2009",
      selected: true,
      totalInStock: 4,
    };

    useTradingStore.getState().addToCartLocally(moto);
    useTradingStore.getState().addToCartLocally(moto);

    const cart = useTradingStore.getState().cartItems;
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it("Должны правильно считаться selected товары", () => {
    useTradingStore
      .getState()
      .setCart([
        { id: "1", selected: true, price: 100, quantity: 1 } as any,
        { id: "2", selected: false, price: 500, quantity: 1 } as any,
      ]);

    const selectedCount = useTradingStore
      .getState()
      .cartItems.filter((i) => i.selected).length;
    expect(selectedCount).toBe(1);
  });
});
