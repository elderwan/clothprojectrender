import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { findUserById, updateUser } from '../models/userModel.js';
import { getAddressesByUser, createAddress, updateAddress, deleteAddress } from '../models/addressModel.js';

export async function getProfileApi(req: Request, res: Response): Promise<void> {
  try {
    const [user, addresses] = await Promise.all([
      findUserById(req.session.user!.id),
      getAddressesByUser(req.session.user!.id),
    ]);
    res.status(200).json({ user, addresses });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function updateProfileApi(req: Request, res: Response): Promise<void> {
  try {
    const { full_name, phone, password, confirm_password } = req.body;
    const updates: Record<string, string> = { full_name, phone };

    if (password) {
      if (password !== confirm_password) throw new Error('Passwords do not match.');
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    const updated = await updateUser(req.session.user!.id, updates);
    req.session.user = { ...req.session.user!, ...updated };
    res.status(200).json({ message: 'profile updated', user: updated });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function getAddressesApi(req: Request, res: Response): Promise<void> {
  try {
    const addresses = await getAddressesByUser(req.session.user!.id);
    res.status(200).json({ addresses });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function createAddressApi(req: Request, res: Response): Promise<void> {
  try {
    const { label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;
    const address = await createAddress({
      user_id: req.session.user!.id,
      label: label || 'Home',
      full_name,
      phone: phone || null,
      address_line1,
      address_line2: address_line2 || null,
      city,
      state: state || null,
      postal_code,
      country: country || 'MY',
      is_default: is_default === true || is_default === 'true' || is_default === 'on',
    });
    res.status(201).json({ message: 'address created', address });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function updateAddressApi(req: Request, res: Response): Promise<void> {
  try {
    const { label, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;
    const address = await updateAddress(req.params.id, req.session.user!.id, {
      label: label || 'Home',
      full_name,
      phone: phone || null,
      address_line1,
      address_line2: address_line2 || null,
      city,
      state: state || null,
      postal_code,
      country: country || 'MY',
      is_default: is_default === true || is_default === 'true' || is_default === 'on',
    });
    res.status(200).json({ message: 'address updated', address });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function deleteAddressApi(req: Request, res: Response): Promise<void> {
  try {
    await deleteAddress(req.params.id, req.session.user!.id);
    res.status(200).json({ message: 'address deleted' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}
