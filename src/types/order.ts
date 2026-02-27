export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  address_id?: string;
  status: OrderStatus;
  total_amount: number;
  created_at?: string;
  updated_at?: string;
  // joined
  items?: OrderItem[];
  user_email?: string;
  user_name?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  size?: string;
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
