import { supabase } from '../../data/supabaseClient.js';
import type { CreateOrderInput, Order, OrderAddressSnapshot, OrderItem } from '../types/order.js';
import { getPrimaryImagesBulk } from './productImageModel.js';

const VALID_ORDER_STATUS = new Set(['pending', 'processing', 'payed', 'shipped', 'delivered', 'cancelled']);
export type AdminOrderStatus = 'all' | 'pending' | 'processing' | 'payed' | 'shipped' | 'delivered' | 'cancelled';
export interface AdminOrderSearchFilters {
  order_no?: string;
  customer?: string;
  status?: AdminOrderStatus;
  date_from?: string;
  date_to?: string;
  min_total?: number;
  max_total?: number;
}

function getOrderAddressSnapshot(row: any): OrderAddressSnapshot | null {
  if (!row?.shipping_full_name || !row?.shipping_address_line1 || !row?.shipping_city || !row?.shipping_postal_code || !row?.shipping_country) {
    return null;
  }

  return {
    label: row.shipping_label ?? null,
    full_name: row.shipping_full_name,
    phone: row.shipping_phone ?? null,
    address_line1: row.shipping_address_line1,
    address_line2: row.shipping_address_line2 ?? null,
    city: row.shipping_city,
    state: row.shipping_state ?? null,
    postal_code: row.shipping_postal_code,
    country: row.shipping_country,
  };
}

export async function getOrdersByUser(userId: string, limit?: number, offset?: number): Promise<Order[]> {
  let query = supabase
    .from('orders')
    .select('*, order_items(*, products(name))')
    .eq('user_id', userId)
    .eq('del_flg', false)
    .order('created_at', { ascending: false });

  if (limit !== undefined) query = query.limit(limit);
  if (offset !== undefined) query = query.range(offset, offset + (limit || 10) - 1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const orders = (data ?? []) as any[];
  
  // Extract all unique product IDs across all orders to fetch images in bulk
  const allProductIds = new Set<string>();
  orders.forEach(order => {
    (order.order_items ?? []).forEach((item: any) => {
      if (item.product_id) allProductIds.add(item.product_id);
    });
  });

  const imageMap = await getPrimaryImagesBulk(Array.from(allProductIds));

  return orders.map((row: any) => ({
    ...row,
    order_items: (row.order_items ?? [])
      .filter((i: any) => !i.del_flg)
      .map((i: any) => ({
        ...i,
        product_name: i.products?.name,
        product_image: imageMap.get(i.product_id),
        unit_price: i.unit_price,
      })),
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
  
  const orderItems = (row.order_items ?? []).filter((i: any) => !i.del_flg);
  const productIds = orderItems.map((i: any) => i.product_id);
  const imageMap = await getPrimaryImagesBulk(productIds);

  return {
    ...row,
    user_email: row.users?.email,
    user_name:  row.users?.full_name,
    shipping_address: getOrderAddressSnapshot(row),
    items: orderItems.map((i: any) => ({
      ...i,
      product_name:  i.products?.name,
      product_image: imageMap.get(i.product_id),
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

export async function getRecentOrders(limit = 5): Promise<Order[]> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 5;
  const { data, error } = await supabase
    .from('orders')
    .select('*, users(email, full_name)')
    .eq('del_flg', false)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({
    ...row,
    user_email: row.users?.email,
    user_name: row.users?.full_name,
  })) as Order[];
}

export async function getOrderRevenueTotal(): Promise<number> {
  const { data, error } = await supabase.rpc('get_demo_revenue_total');
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
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
  const payload = normalizedItems.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    size: item.size ?? null,
  }));

  const { data: orderId, error } = await supabase.rpc('create_demo_order_with_inventory', {
    p_user_id: input.user_id,
    p_address_id: input.address_id ?? null,
    p_items: payload,
  });
  if (error) throw new Error(error.message);
  if (!orderId) throw new Error('Failed to create order.');

  const order = await getOrderById(String(orderId));
  if (!order) throw new Error('Failed to load created order.');
  return order;
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  if (!VALID_ORDER_STATUS.has(status)) {
    throw new Error('Invalid order status.');
  }

  const current = await getOrderById(id);
  if (!current) {
    throw new Error('Order not found.');
  }

  const currentStatus = current.status;
  const nextStatus = status as Order['status'];
  const isCancelled = nextStatus === 'cancelled';
  const allowedTransitions: Record<Order['status'], Order['status'][]> = {
    pending: ['processing', 'cancelled'],
    processing: ['payed', 'cancelled'],
    payed: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };

  if (currentStatus !== nextStatus && !isCancelled && !allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${nextStatus}.`);
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: nextStatus })
    .eq('id', id)
    .eq('del_flg', false);
  if (error) throw new Error(error.message);

  const updated = await getOrderById(id);
  if (!updated) throw new Error('Failed to load updated order.');
  return updated;
}

export async function confirmOrderPayment(
  id: string,
  userId: string,
  addressId: string,
  addressSnapshot: OrderAddressSnapshot
): Promise<Order> {
  const order = await getOrderById(id);
  if (!order || order.user_id !== userId) {
    throw new Error('Order not found.');
  }
  if (order.status !== 'processing' && order.status !== 'pending') {
    throw new Error('This order can no longer be paid from the client side.');
  }

  const { error } = await supabase
    .from('orders')
    .update({
      address_id: addressId,
      status: 'payed',
      shipping_label: addressSnapshot.label ?? null,
      shipping_full_name: addressSnapshot.full_name,
      shipping_phone: addressSnapshot.phone ?? null,
      shipping_address_line1: addressSnapshot.address_line1,
      shipping_address_line2: addressSnapshot.address_line2 ?? null,
      shipping_city: addressSnapshot.city,
      shipping_state: addressSnapshot.state ?? null,
      shipping_postal_code: addressSnapshot.postal_code,
      shipping_country: addressSnapshot.country,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .eq('del_flg', false);
  if (error) throw new Error(error.message);

  const updated = await getOrderById(id);
  if (!updated) throw new Error('Failed to load updated order.');
  return updated;
}

export async function countOrdersByUser(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('del_flg', false);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function countOrders(): Promise<number> {
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('del_flg', false);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
