//Этот класс позволит «выбрасывать» ошибку с нужным статус-кодом в любом месте (сервисе или контроллере)
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
