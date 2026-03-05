import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser } from '../models/userModel.js';
import type { RegisterInput, LoginInput, PublicUser } from '../types/user.js';

const SALT_ROUNDS = 10;

export async function register(input: RegisterInput): Promise<PublicUser> {
  const existing = await findUserByEmail(input.email);
  if (existing) throw new Error('Email already registered.');

  const password_hash = await bcrypt.hash(input.password, SALT_ROUNDS);
  return createUser({ ...input, password_hash });
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const user = await findUserByEmail(input.email);
  if (!user) throw new Error('Invalid email or password.');
  if (!user.is_active) throw new Error('Account is disabled.');

  const match = await bcrypt.compare(input.password, user.password_hash);
  if (!match) throw new Error('Invalid email or password.');

  const { password_hash: _, ...pub } = user;
  return pub;
}

export async function adminLoginUsecase(body: unknown): Promise<PublicUser> {
  const payload = body as Partial<LoginInput> | null | undefined;
  if (!payload?.email || !payload?.password) {
    throw new Error('Email and password are required.');
  }

  const user = await login({
    email: payload.email,
    password: payload.password,
  });

  if (user.role !== 'admin') {
    throw new Error('Access denied.');
  }

  return user;
}
