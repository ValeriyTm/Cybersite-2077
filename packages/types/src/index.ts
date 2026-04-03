//Типизируем роли:
export type UserRole =
  | "USER"
  | "MANAGER"
  | "CONTENT_EDITOR"
  | "ADMIN"
  | "SUPERADMIN";

//Типизируем пол:
export type UserGender = "MALE" | "FEMALE" | null;

//Типизируем данные юзера:
export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActivated: boolean;
  avatarUrl: string | null;
  phone: string | null;
  birthday: string | null;
  gender: UserGender;
  is2FAEnabled: boolean;
  createdAt: string;
  defaultAddress: string | null;
  defaultLat: number | null;
  defaultLng: number | null;
}

//Типизируем ответ при авторизации:
export interface AuthResponse {
  accessToken: string;
  user: IUser;
}
