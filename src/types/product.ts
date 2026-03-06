export type ProductAudience = 'men' | 'women' | 'kids';

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  del_flg: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  composition_care?: string;
  price: number;
  category_id?: string;
  category?: string;           // joined category name
  stock_quantity: number;
  click_count: number;
  is_active: boolean;
  audience: ProductAudience;
  del_flg: boolean;
  created_at?: string;
  updated_at?: string;
  // populated when loaded with images
  images?: ProductImage[];
  primary_image?: string;      // convenience: URL of the primary image
}
