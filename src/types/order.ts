export interface OrderAddressSnapshot {
  label?: string | null;
  full_name: string;
  phone?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
}

export type OrderStatus = 'pending' | 'processing' | 'payed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  address_id?: string;
  status: OrderStatus;
  total_amount: number;
  del_flg: boolean;
  created_at?: string;
  updated_at?: string;
  shipping_label?: string | null;
  shipping_full_name?: string | null;
  shipping_phone?: string | null;
  shipping_address_line1?: string | null;
  shipping_address_line2?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  // joined
  items?: OrderItem[];
  user_email?: string;
  user_name?: string;
  shipping_address?: OrderAddressSnapshot | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  size?: string;
  del_flg: boolean;
  created_at?: string;
  // joined
  product_name?: string;
  product_image?: string;
}

export interface CreateOrderInput {
  user_id: string;
  address_id?: string;
  items: Array<{ product_id: string; quantity: number; size?: string }>;
}
