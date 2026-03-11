export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  del_flg: boolean;
  created_at?: string;
  updated_at?: string;
  product_name?: string;
  product_price?: number;
  product_category?: string;
  product_audience?: 'men' | 'women' | 'kids';
  product_stock_quantity?: number;
  product_is_active?: boolean;
  product_image?: string;
}
