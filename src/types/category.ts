export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: number;
  image_url: string | null;
  icon: string | null;
  banner_url: string | null;
  mobile_banner_url: string | null;
  tablet_banner_url: string | null;
  featured: boolean;
  status: 'active' | 'draft' | 'archived' | 'hidden';
  homepage_status: boolean;
  navigation_status: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryTreeItem extends Category {
  children?: CategoryTreeItem[];
}
