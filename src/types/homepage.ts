export type SectionType = 
  | 'hero_banner'
  | 'category_grid'
  | 'flash_deals'
  | 'featured_products'
  | 'best_sellers'
  | 'new_arrivals'
  | 'top_rated'
  | 'trending'
  | 'organic'
  | 'budget_deals'
  | 'imported'
  | 'odamarket_choice'
  | 'recently_restocked'
  | 'limited_stock'
  | 'popular_brands'
  | 'recommended'
  | 'supplier_spotlight'
  | 'buy_more_save_more'
  | 'shop_by_brand'
  | 'footer_promotions'
  | 'custom_grid';

export interface HomepageSection {
  id: string;
  name: string;
  title: string | null;
  subtitle: string | null;
  type: SectionType;
  is_active: boolean;
  sort_order: number;
  settings: {
    layout?: 'grid' | 'carousel';
    max_products?: number;
    products_per_row_desktop?: number;
    products_per_row_tablet?: number;
    products_per_row_mobile?: number;
    auto_play?: boolean;
    background_color?: string;
    icon?: string;
    show_view_all?: boolean;
    filters?: {
      category_id?: string;
      brand_id?: string;
      min_price?: number;
      max_price?: number;
      is_organic?: boolean;
      is_imported?: boolean;
      min_rating?: number;
      has_discount?: boolean;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface SectionProduct {
  id: string;
  section_id: string;
  product_id: string;
  sort_order: number;
  created_at: string;
}

export interface HomepageBanner {
  id: string;
  title: string;
  subtitle: string | null;
  button_text: string | null;
  button_link: string | null;
  bg_color: string | null;
  position: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  desktop_image_url: string;
  mobile_image_url: string | null;
  created_at: string;
  updated_at: string;
}
