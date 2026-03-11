import type { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PublicUser } from '../types/user.js';

const AUTH_COOKIE_NAME = 'maison_auth';
const JWT_ALG = 'HS256';
const JWT_TTL_SECONDS = 60 * 60 * 24;

type TokenPayload = PublicUser & {
  iat: number;
  exp: number;
};

function getJwtSecret(): string {
  return process.env.JWT_SECRET || process.env.SESSION_SECRET || 'maison-secret-change-in-prod';
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function createSignature(input: string): string {
  return createHmac('sha256', getJwtSecret()).update(input).digest('base64url');
}

function isSafeSignature(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(actual, 'utf8');
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function signAuthToken(user: PublicUser): string {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: JWT_ALG, typ: 'JWT' }));
  const payload = encodeBase64Url(JSON.stringify({
    ...user,
    iat: now,
    exp: now + JWT_TTL_SECONDS,
  } satisfies TokenPayload));
  const signature = createSignature(`${header}.${payload}`);
  return `${header}.${payload}.${signature}`;
}

export function verifyAuthToken(token: string): PublicUser | null {
  const [headerPart, payloadPart, signaturePart] = token.split('.');
  if (!headerPart || !payloadPart || !signaturePart) return null;

  const expectedSignature = createSignature(`${headerPart}.${payloadPart}`);
  if (!isSafeSignature(expectedSignature, signaturePart)) return null;

  try {
    const header = JSON.parse(decodeBase64Url(headerPart)) as { alg?: string; typ?: string };
    if (header.alg !== JWT_ALG || header.typ !== 'JWT') return null;

    const payload = JSON.parse(decodeBase64Url(payloadPart)) as Partial<TokenPayload>;
    if (!payload.id || !payload.email || !payload.full_name || !payload.role) return null;
    if (payload.exp == null || Number(payload.exp) <= Math.floor(Date.now() / 1000)) return null;

    return {
      id: String(payload.id),
      email: String(payload.email),
      full_name: String(payload.full_name),
      phone: payload.phone ? String(payload.phone) : undefined,
      role: payload.role === 'admin' ? 'admin' : 'client',
      is_active: Boolean(payload.is_active),
      del_flg: Boolean(payload.del_flg),
      created_at: payload.created_at ? String(payload.created_at) : undefined,
      updated_at: payload.updated_at ? String(payload.updated_at) : undefined,
    };
  } catch {
    return null;
  }
}

export function readAuthToken(req: Request): string | null {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return null;

  const target = `${AUTH_COOKIE_NAME}=`;
  for (const chunk of rawCookie.split(';')) {
    const value = chunk.trim();
    if (!value.startsWith(target)) continue;
    return decodeURIComponent(value.slice(target.length));
  }

  return null;
}

export function getAuthUserFromRequest(req: Request): PublicUser | null {
  const token = readAuthToken(req);
  if (!token) return null;
  return verifyAuthToken(token);
}

export function setAuthCookie(res: Response, user: PublicUser): void {
  res.cookie(AUTH_COOKIE_NAME, signAuthToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    //24 expires in 24 hours, expressed in milliseconds
    maxAge: JWT_TTL_SECONDS * 1000, 
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}
