export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  size?: string;
  del_flg: boolean;
  created_at?: string;
  updated_at?: string;
  // joined
  product_name?: string;
  product_price?: number;
  product_image?: string;
  subtotal?: number;

}
