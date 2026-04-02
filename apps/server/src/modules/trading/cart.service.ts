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

    //Метод setex устанавливает время хранения данных на 7 дней:
    await redis.setex(`cart:${userId}`, 60 * 60 * 24 * 7, JSON.stringify(cart));
    return cart;
  }

  //Изменить количество для конкретной позиции:
  async updateQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await this.getCart(userId);
    const item = cart.find((i: any) => i.id === itemId);

    if (item) {
      //Не даем опуститься ниже 1:
      item.quantity = Math.max(1, quantity);

      //Метод setex устанавливает время хранения данных на 7 дней:
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
    //Создаём новый отфильтрованный список товаров,  из которого исключен элемент с указанным itemId:
    cart = cart.filter((i: any) => i.id !== itemId);

    //Обновленный список (уже без удаленного товара) переводится в строку JSON и записывается обратно в Redis:
    await redis.setex(`cart:${userId}`, 60 * 60 * 24 * 7, JSON.stringify(cart));
    //Метод setex устанавливает время хранения данных на 7 дней

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
