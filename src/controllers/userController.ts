import type { Request, Response } from 'express';
import { findUserById, updateUser } from '../models/userModel.js';
import bcrypt from 'bcryptjs';

export async function showProfile(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  const user = await findUserById(req.session.user.id);
  res.render('client/profile', { title: 'My Account', user, error: null, success: null });
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

    const user = await findUserById(req.session.user.id);
    res.render('client/profile', { title: 'My Account', user, error: null, success: 'Profile updated.' });
  } catch (err: any) {
    const user = await findUserById(req.session.user!.id);
    res.render('client/profile', { title: 'My Account', user, error: err.message, success: null });
  }
}
