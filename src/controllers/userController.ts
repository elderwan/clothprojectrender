import type { Request, Response } from 'express';
import { findUserById, findUserByIdFull, updateUser } from '../models/userModel.js';
import {
  getAddressesByUser,
  createAddress, updateAddress, deleteAddress,
} from '../models/addressModel.js';
import { getOrdersByUser } from '../models/orderModel.js';
import bcrypt from 'bcryptjs';

// ── Profile ──────────────────────────────────────────────────

export async function showProfile(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  const [user, addresses, orders] = await Promise.all([
    findUserById(req.session.user.id),
    getAddressesByUser(req.session.user.id),
    getOrdersByUser(req.session.user.id, 5),
  ]);
  res.render('client/profile', {
    title: 'My Account',
    user,
    addresses,
    orders,
    error: typeof req.query.error === 'string' ? req.query.error : null,
    success: typeof req.query.success === 'string' ? req.query.success : null,
  });
}

export async function showEditProfile(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  const user = await findUserById(req.session.user.id);
  res.render('client/editProfile', {
    title: 'Edit Profile',
    user,
    error: typeof req.query.error === 'string' ? req.query.error : null,
    success: typeof req.query.success === 'string' ? req.query.success : null,
  });
}

export async function showAddressBook(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  const [user, addresses] = await Promise.all([
    findUserById(req.session.user.id),
    getAddressesByUser(req.session.user.id),
  ]);
  res.render('client/addressBook', {
    title: 'Address Book',
    user,
    addresses,
    error: typeof req.query.error === 'string' ? req.query.error : null,
    success: typeof req.query.success === 'string' ? req.query.success : null,
  });
}

export async function postUpdateProfile(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  try {
    const { full_name, phone } = req.body;
    const updates: Record<string, string> = { full_name, phone };

    const updated = await updateUser(req.session.user.id, updates);
    req.session.user = { ...req.session.user, ...updated };

    res.redirect('/profile');
  } catch (err: any) {
    const user = await findUserById(req.session.user.id);
    res.render('client/editProfile', { title: 'Edit Profile', user, error: err.message, success: null });
  }
}

export async function showChangePassword(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  res.render('client/changePassword', { title: 'Change Password', error: null, success: null });
}

export async function postChangePassword(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  try {
    const { current_password, new_password, confirm_password } = req.body;
    
    const user = await findUserByIdFull(req.session.user.id);
    if (!user) throw new Error('User not found.');

    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) throw new Error('Current password is incorrect.');

    if (new_password !== confirm_password) throw new Error('New passwords do not match.');
    
    const password_hash = await bcrypt.hash(new_password, 10);
    await updateUser(req.session.user.id, { password_hash });

    res.render('client/changePassword', { title: 'Change Password', error: null, success: 'Password updated successfully.' });
  } catch (err: any) {
    res.render('client/changePassword', { title: 'Change Password', error: err.message, success: null });
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
    res.redirect('/profile/addresses?success=' + encodeURIComponent('Address added successfully.'));
  } catch (err: any) {
    res.redirect('/profile/addresses?error=' + encodeURIComponent(err.message));
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
    res.redirect('/profile/addresses?success=' + encodeURIComponent('Address updated successfully.'));
  } catch (err: any) {
    res.redirect('/profile/addresses?error=' + encodeURIComponent(err.message));
  }
}

export async function postDeleteAddress(req: Request, res: Response): Promise<void> {
  if (!req.session.user) return void res.redirect('/login');
  await deleteAddress(req.params.id, req.session.user.id);
  res.redirect('/profile/addresses?success=' + encodeURIComponent('Address deleted successfully.'));
}
