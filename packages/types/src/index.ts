export type UserRole =
  | "USER"
  | "MANAGER"
  | "CONTENT_EDITOR"
  | "ADMIN"
  | "SUPERADMIN";
export type UserGender = "MALE" | "FEMALE" | null;

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
}

export interface AuthResponse {
  accessToken: string;
  user: IUser;
}
