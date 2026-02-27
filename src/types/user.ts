export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  role: 'client' | 'admin';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PublicUser = Omit<User, 'password_hash'>;

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
