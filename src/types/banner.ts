export type BannerKind = 'home' | 'category';
export type BannerAudienceScope = 'men' | 'women' | 'kids';

export interface HomeBanner {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  product_id?: string | null;
  banner_kind: BannerKind;
  audience_scope?: BannerAudienceScope | null;
  is_active: boolean;
  active_from?: string | null;
  active_to?: string | null;
  del_flg: boolean;
  created_at?: string;
  updated_at?: string;
  product_name?: string;
  product_audience?: BannerAudienceScope | null;
  product_category_name?: string;
  product_category_slug?: string;
}

export interface SaveHomeBannerInput {
  title: string;
  description?: string;
  image_url: string;
  product_id?: string | null;
  banner_kind: BannerKind;
  audience_scope?: BannerAudienceScope | null;
  is_active: boolean;
  active_from?: string | null;
  active_to?: string | null;
}
