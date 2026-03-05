import { supabase } from '../../data/supabaseClient.js';
import type { Order, OrderItem, CreateOrderInput } from '../types/order.js';

const VALID_ORDER_STATUS = new Set(['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
export type AdminOrderStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export interface AdminOrderSearchFilters {
  order_no?: string;
  customer?: string;
  status?: AdminOrderStatus;
  date_from?: string;
  date_to?: string;
  min_total?: number;
  max_total?: number;
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name))')
    .eq('user_id', userId)
    .eq('del_flg', false)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    ...row,
    order_items: (row.order_items ?? []).filter((i: any) => !i.del_flg),
  })) as Order[];
}

export async function getOrderById(id: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(name)), users(email, full_name)')
    .eq('id', id)
    .eq('del_flg', false)
    .single();
  if (error) return null;
  const row = data as any;
  return {
    ...row,
    user_email: row.users?.email,
    user_name:  row.users?.full_name,
    items: (row.order_items ?? [])
      .filter((i: any) => !i.del_flg)
      .map((i: any) => ({
      ...i,
      product_name:  i.products?.name,
      })),
  };
}

export async function getAllOrders(status?: string): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*, users(email, full_name)')
    .eq('del_flg', false)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    ...row,
    user_email: row.users?.email,
    user_name:  row.users?.full_name,
  }));
}

export async function searchOrdersForAdmin(filters: AdminOrderSearchFilters): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*, users(email, full_name)')
    .eq('del_flg', false)
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status) as typeof query;
  }
  if (filters.order_no) {
    query = query.ilike('id', `%${filters.order_no}%`) as typeof query;
  }
  if (filters.date_from) {
    query = query.gte('created_at', `${filters.date_from}T00:00:00.000Z`) as typeof query;
  }
  if (filters.date_to) {
    query = query.lte('created_at', `${filters.date_to}T23:59:59.999Z`) as typeof query;
  }
  if (typeof filters.min_total === 'number' && Number.isFinite(filters.min_total)) {
    query = query.gte('total_amount', filters.min_total) as typeof query;
  }
  if (typeof filters.max_total === 'number' && Number.isFinite(filters.max_total)) {
    query = query.lte('total_amount', filters.max_total) as typeof query;
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = (data ?? []).map((row: any) => ({
    ...row,
    user_email: row.users?.email,
    user_name: row.users?.full_name,
  }));

  const customer = (filters.customer ?? '').trim().toLowerCase();
  if (customer) {
    rows = rows.filter((row: any) => {
      const text = `${row.user_name ?? ''} ${row.user_email ?? ''}`.toLowerCase();
      return text.includes(customer);
    });
  }

  return rows as Order[];
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  if (!input.items.length) throw new Error('Order items cannot be empty.');

  const normalizedItems = input.items.map((i) => ({
    ...i,
    quantity: Number(i.quantity),
  }));
  if (normalizedItems.some(i => !Number.isInteger(i.quantity) || i.quantity <= 0)) {
    throw new Error('Invalid item quantity.');
  }

  const requestedQty = new Map<string, number>();
  for (const item of normalizedItems) {
    requestedQty.set(item.product_id, (requestedQty.get(item.product_id) ?? 0) + item.quantity);
  }

  // Fetch current prices for snapshot
  const productIds = Array.from(requestedQty.keys());
  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, price, stock_quantity, is_active')
    .in('id', productIds)
    .eq('del_flg', false);
  if (pErr) throw new Error(pErr.message);

  const productRows = products ?? [];
  const productMap = new Map(productRows.map((p: any) => [p.id, p]));

  for (const productId of productIds) {
    const product = productMap.get(productId);
    if (!product) throw new Error('Some products no longer exist.');
    if (!product.is_active) throw new Error('Some products are no longer available.');
    const needed = requestedQty.get(productId) ?? 0;
    if ((product.stock_quantity ?? 0) < needed) {
      throw new Error('Some products are out of stock.');
    }
  }

  const priceMap = new Map(productRows.map((p: any) => [p.id, p.price]));
  const total = normalizedItems.reduce((sum, i) => {
    return sum + (priceMap.get(i.product_id) ?? 0) * i.quantity;
  }, 0);

  const { data: order, error: oErr } = await supabase
    .from('orders')
    .insert({ user_id: input.user_id, address_id: input.address_id ?? null, total_amount: total, status: 'pending', del_flg: false })
    .select()
    .single();
  if (oErr) throw new Error(oErr.message);

  const lineItems = normalizedItems.map(i => ({
    order_id:   order.id,
    product_id: i.product_id,
    quantity:   i.quantity,
    unit_price: priceMap.get(i.product_id) ?? 0,
    size:       i.size ?? null,
    del_flg:    false,
  }));

  const { error: liErr } = await supabase.from('order_items').insert(lineItems);
  if (liErr) throw new Error(liErr.message);

  return order as Order;
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  if (!VALID_ORDER_STATUS.has(status)) {
    throw new Error('Invalid order status.');
  }
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .eq('del_flg', false)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Order;
}

export async function countOrders(): Promise<number> {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('del_flg', false);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
