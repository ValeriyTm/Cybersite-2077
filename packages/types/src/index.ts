//Типизируем роли:
export type UserRole =
  | "USER"
  | "MANAGER"
  | "CONTENT_EDITOR"
  | "ADMIN"
  | "SUPERADMIN";

//Типизируем пол:
export type UserGender = "MALE" | "FEMALE" | null; //null, т.к. поле опциональное

//Типизируем данные юзера:
export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
  phone: string | null;
  birthday: string | null; //Сервер отправляет Date | null, но Date будет преобразовано в string
  gender: UserGender;
  is2FAEnabled: boolean;
  defaultAddress: string | null;
  defaultLat: number | null;
  defaultLng: number | null;
}

//Типизируем ответ при авторизации:
export interface AuthResponse {
  accessToken: string;
  user: IUser;
}
