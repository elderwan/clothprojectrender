export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id?: string;
  category?: string;    // joined category name
  stock_quantity: number;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}
