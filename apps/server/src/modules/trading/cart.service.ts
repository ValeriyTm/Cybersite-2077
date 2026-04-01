import { redis } from "../../lib/redis.js";

export class CartService {
  private getCartKey(userId: string) {
    return `cart:${userId}`;
  }

  //Получить товары в корзине:
  async getCart(userId: string) {
    const data = await redis.get(this.getCartKey(userId));
    return data ? JSON.parse(data) : [];
  }

  //Добавить товар в корзину / обновить количество:
  async addToCart(userId: string, item: any) {
    const cart = await this.getCart(userId);
    const existing = cart.find((i: any) => i.id === item.id);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      //Сохраняем все данные, нужные для отрисовки макета:
      cart.push({
        id: item.id,
        model: item.model,
        price: item.price,
        image: item.image,
        slug: item.slug,
        brandSlug: item.brandSlug,
        quantity: item.quantity,
        selected: true, //Поле для чекбокса выбора
      });
    }

    await redis.setex(`cart:${userId}`, 60 * 60 * 24 * 7, JSON.stringify(cart));
    return cart;
  }

  //Удалить товар из корзины:
  async removeFromCart(userId: string, itemId: string) {
    let cart = await this.getCart(userId);
    cart = cart.filter((i: any) => i.id !== itemId);

    await redis.set(this.getCartKey(userId), JSON.stringify(cart));
    return cart;
  }

  //Изменить количество для конкретной позиции:
  async updateQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await this.getCart(userId);
    const item = cart.find((i: any) => i.id === itemId);

    if (item) {
      // Не даем опуститься ниже 1
      item.quantity = Math.max(1, quantity);
      await redis.setex(
        `cart:${userId}`,
        60 * 60 * 24 * 7,
        JSON.stringify(cart),
      );
    }
    return cart;
  }

  //Удалить позицию из корзины:
  async removeItem(userId: string, itemId: string) {
    let cart = await this.getCart(userId);
    cart = cart.filter((i: any) => i.id !== itemId);

    await redis.setex(`cart:${userId}`, 60 * 60 * 24 * 7, JSON.stringify(cart));
    return cart;
  }

  //Удаление всех позиций из корзины:
  async removeMultiple(userId: string, itemIds: string[]) {
    let cart = await this.getCart(userId);
    cart = cart.filter((i: any) => !itemIds.includes(i.id));

    await redis.setex(`cart:${userId}`, 60 * 60 * 24 * 7, JSON.stringify(cart));
    return cart;
  }
}

export const cartService = new CartService();
