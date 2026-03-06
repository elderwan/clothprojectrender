export interface HomeBanner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  product_id?: string | null;
  is_active: boolean;
  active_from?: string | null;
  active_to?: string | null;
  del_flg: boolean;
  created_at?: string;
  updated_at?: string;
  product_name?: string;
}

export interface SaveHomeBannerInput {
  title: string;
  description?: string;
  image_url: string;
  product_id?: string | null;
  is_active: boolean;
  active_from?: string | null;
  active_to?: string | null;
}
