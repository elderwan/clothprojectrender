import type { Request, Response } from 'express';
import { findUserById, updateUser } from '../models/userModel.js';
import {
  getAddressesByUser, getAddressById,
  createAddress, updateAddress, deleteAddress,
} from '../models/addressModel.js';
import bcrypt from 'bcryptjs';

// ── Profile ──────────────────────────────────────────────────

export async function showProfile(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  const [user, addresses] = await Promise.all([
    findUserById(req.session.user.id),
    getAddressesByUser(req.session.user.id),
  ]);
  res.render('client/profile', { title: 'My Account', user, addresses, error: null, success: null });
}

export async function postUpdateProfile(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  try {
    const { full_name, phone, password, confirm_password } = req.body;
    const updates: Record<string, string> = { full_name, phone };

    if (password) {
      if (password !== confirm_password) throw new Error('Passwords do not match.');
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    const updated = await updateUser(req.session.user.id, updates);
    req.session.user = { ...req.session.user, ...updated };

    const [user, addresses] = await Promise.all([
      findUserById(req.session.user.id),
      getAddressesByUser(req.session.user.id),
    ]);
    res.render('client/profile', { title: 'My Account', user, addresses, error: null, success: 'Profile updated.' });
  } catch (err: any) {
    const [user, addresses] = await Promise.all([
      findUserById(req.session.user!.id),
      getAddressesByUser(req.session.user!.id),
    ]);
    res.render('client/profile', { title: 'My Account', user, addresses, error: err.message, success: null });
  }
}

// ── Addresses ────────────────────────────────────────────────

export async function postAddAddress(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  try {
    const { label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;
    await createAddress({
      user_id:      req.session.user.id,
      label:        label || 'Home',
      full_name,
      phone:        phone || null,
      address_line1,
      address_line2: address_line2 || null,
      city,
      state:        state || null,
      postal_code,
      country:      country || 'MY',
      is_default:   is_default === 'on',
    });
    res.redirect('/profile#addresses');
  } catch (err: any) {
    res.redirect('/profile?error=' + encodeURIComponent(err.message));
  }
}

export async function postEditAddress(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  try {
    const { label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;
    await updateAddress(req.params.id, req.session.user.id, {
      label:        label || 'Home',
      full_name,
      phone:        phone || null,
      address_line1,
      address_line2: address_line2 || null,
      city,
      state:        state || null,
      postal_code,
      country:      country || 'MY',
      is_default:   is_default === 'on',
    });
    res.redirect('/profile#addresses');
  } catch (err: any) {
    res.redirect('/profile?error=' + encodeURIComponent(err.message));
  }
}

export async function postDeleteAddress(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  await deleteAddress(req.params.id, req.session.user.id);
  res.redirect('/profile#addresses');
}

