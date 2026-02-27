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

export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CreateAddressInput = Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>;
