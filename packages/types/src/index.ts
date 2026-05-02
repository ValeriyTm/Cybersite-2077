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

export interface UserFullInfo {
  id: string;
  email: string;
  emailVerified: Date | null;
  name: string;
  passwordHash: string;
  phone: string | null;
  birthday: Date | null;
  gender: UserGender;
  role: UserRole;
  isActivated: boolean;
  activationToken: string | null;
  provider: string | null;
  providerId: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  resetPasswordToken: string | null;
  resetPasswordExpires: Date | null;
  twoFactorSecret: string | null;
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
