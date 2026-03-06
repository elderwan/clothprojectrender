import type { Request, Response } from 'express';
import { supabase } from '../../data/supabaseClient.js';

const VALID_AUDIENCE = new Set(['men', 'women', 'kids']);

async function loadCategories() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('del_flg', false)
    .order('audience')
    .order('name');
  if (error) throw new Error(error.message);
  return categories ?? [];
}

export async function showCategorySettings(req: Request, res: Response): Promise<void> {
  const categories = await loadCategories();
  res.render('admin/categorySettings', {
    title: 'Category Settings',
    categories,
    editingCategory: null,
    error: null,
  });
}

export async function showEditCategory(req: Request, res: Response): Promise<void> {
  const [categories, categoryResult] = await Promise.all([
    loadCategories(),
    supabase.from('categories').select('*').eq('id', req.params.id).eq('del_flg', false).single(),
  ]);
  if (categoryResult.error || !categoryResult.data) {
    return void res.redirect('/admin/settings/categories');
  }
  res.render('admin/categorySettings', {
    title: 'Category Settings',
    categories,
    editingCategory: categoryResult.data,
    error: null,
  });
}

export async function handleAddCategory(req: Request, res: Response): Promise<void> {
  try {
    const name = String(req.body.name ?? '').trim();
    const slug = String(req.body.slug ?? '').trim().toLowerCase();
    const audience = String(req.body.audience ?? '').trim().toLowerCase();

    if (!name) throw new Error('Category name is required.');
    if (!slug) throw new Error('Category slug is required.');
    if (!VALID_AUDIENCE.has(audience)) throw new Error('Audience is required.');

    const { error } = await supabase.from('categories').insert({
      name,
      slug,
      audience,
      del_flg: false,
    });
    if (error) throw new Error(error.message);

    res.redirect('/admin/settings/categories');
  } catch (err: any) {
    const categories = await loadCategories();

    res.render('admin/categorySettings', {
      title: 'Category Settings',
      categories,
      editingCategory: null,
      error: err.message,
    });
  }
}

export async function handleEditCategory(req: Request, res: Response): Promise<void> {
  try {
    const name = String(req.body.name ?? '').trim();
    const slug = String(req.body.slug ?? '').trim().toLowerCase();
    const audience = String(req.body.audience ?? '').trim().toLowerCase();

    if (!name) throw new Error('Category name is required.');
    if (!slug) throw new Error('Category slug is required.');
    if (!VALID_AUDIENCE.has(audience)) throw new Error('Audience is required.');

    const { error } = await supabase
      .from('categories')
      .update({ name, slug, audience })
      .eq('id', req.params.id)
      .eq('del_flg', false);
    if (error) throw new Error(error.message);

    await supabase
      .from('products')
      .update({ audience })
      .eq('category_id', req.params.id)
      .eq('del_flg', false);

    res.redirect('/admin/settings/categories');
  } catch (err: any) {
    const [categories, categoryResult] = await Promise.all([
      loadCategories(),
      supabase.from('categories').select('*').eq('id', req.params.id).eq('del_flg', false).single(),
    ]);
    res.render('admin/categorySettings', {
      title: 'Category Settings',
      categories,
      editingCategory: categoryResult.data ?? null,
      error: err.message,
    });
  }
}

export async function handleDeleteCategory(req: Request, res: Response): Promise<void> {
  const categoryId = req.params.id;
  await supabase
    .from('products')
    .update({ category_id: null })
    .eq('category_id', categoryId)
    .eq('del_flg', false);

  const { error } = await supabase
    .from('categories')
    .update({ del_flg: true })
    .eq('id', categoryId)
    .eq('del_flg', false);
  if (error) throw new Error(error.message);

  res.redirect('/admin/settings/categories');
}
