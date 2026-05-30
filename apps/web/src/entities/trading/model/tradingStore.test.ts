import { describe, it, expect, beforeEach } from "vitest";
import { useTradingStore } from "./tradingStore";

describe("TradingStore", () => {
  beforeEach(() => {
    useTradingStore.getState().clearTrading();
  });

  it("Должно увеличиваться количество товара, если товар уже в корзине", () => {
    const moto = {
      id: "1",
      quantity: 1,
      model: "Yamaha",
      price: 1000,
      image: "",
      brandSlug: "yamaha",
      slug: "yamaha2009",
      selected: true,
      totalInStock: 4,
      year: 2000,
    };

    useTradingStore.getState().addToCartLocally(moto);
    useTradingStore.getState().addToCartLocally(moto);

    const cart = useTradingStore.getState().cartItems;
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);
  });

  it("Должны правильно считаться selected товары", () => {
    useTradingStore.getState().setCart([
      {
        brand: {
          country: "Italy",
          createdAt: "date",
          id: "id-brand",
          image: "",
          name: "Aprilia",
          slug: "aprilia",
          updatedAt: "date",
        },
        brandId: "id-brand",
        category: "SPORT",
        colors: [],
        comments: null,
        coolingSystem: "AIR",
        createdAt: "date",
        discountData: {
          originalPrice: 1000000,
          finalPrice: 900000,
          discountPercent: 10,
          isPersonal: false,
        },
        displacement: 500,
        engineType: "engine",
        frontBrakes: null,
        frontTyre: null,
        fuelConsumption: null,
        fuelSystem: null,
        gearbox: null,
        id: "model-id",
        images: [],
        model: "Aprilia F2",
        power: null,
        price: 1000000,
        rating: 4.5,
        rearBrakes: null,
        rearTyre: null,
        quantity: 3,
        selected: true,
        siteCategoryId: "111",
        slug: "aprilia-f22010",
        starter: null,
        stocks: [
          {
            quantity: 7,
            reserved: 2,
          },
        ],
        topSpeed: null,
        totalInStock: 10,
        transmission: null,
        updatedAt: "date",
        year: 2010,
      },
      {
        brand: {
          country: "Italy",
          createdAt: "date",
          id: "id-brand",
          image: "",
          name: "Aprilia",
          slug: "aprilia",
          updatedAt: "date",
        },
        brandId: "id-brand",
        category: "SPORT",
        colors: [],
        comments: null,
        coolingSystem: "AIR",
        createdAt: "date",
        discountData: {
          originalPrice: 500000,
          finalPrice: 500000,
          discountPercent: null,
          isPersonal: false,
        },
        displacement: 500,
        engineType: "engine",
        frontBrakes: null,
        frontTyre: null,
        fuelConsumption: null,
        fuelSystem: null,
        gearbox: null,
        id: "model-id",
        images: [],
        model: "Aprilia F1",
        power: null,
        price: 500000,
        rating: 4.5,
        rearBrakes: null,
        rearTyre: null,
        quantity: 3,
        selected: true,
        siteCategoryId: "111",
        slug: "aprilia-f12010",
        starter: null,
        stocks: [
          {
            quantity: 7,
            reserved: 2,
          },
        ],
        topSpeed: null,
        totalInStock: 10,
        transmission: null,
        updatedAt: "date",
        year: 2010,
      },
    ]);

    const selectedCount = useTradingStore
      .getState()
      .cartItems.filter((i) => i.selected).length;
    expect(selectedCount).toBe(2);
  });
});
