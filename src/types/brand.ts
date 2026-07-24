export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  website: string | null;
  country: string | null;
  featured: boolean;
  status: 'active' | 'draft' | 'archived' | 'hidden';
  homepage_status: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  created_at: string;
  updated_at: string;
}
