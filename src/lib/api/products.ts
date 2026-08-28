import { supabase } from '../supabase';
import { Product } from '../../types/product';

export interface GetProductsOptions {
  limit?: number;
  featuredOnly?: boolean;
  excludeIds?: string[];
  maxPrice?: number;
}

/**
 * Fetches active, in-stock products directly from the Supabase products table.
 * Standardized across storefront, featured sections, and cart recommendations.
 */
export async function getActiveProducts(options: GetProductsOptions = {}): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        sale_price,
        wholesale_price,
        wholesale_min_qty,
        wholesale_unit,
        stock,
        low_stock_threshold,
        sku,
        barcode,
        is_active,
        is_public,
        image_url,
        is_wholesale,
        is_featured,
        is_new_arrival,
        is_flash_sale,
        is_best_deal,
        is_lowest_price,
        is_electronics_zone,
        category_id,
        brand_id,
        created_at,
        updated_at,
        supplier_id
      `)
      .eq('is_active', true)
      .gt('stock', 0);

    if (options.featuredOnly) {
      query = query.eq('is_featured', true);
    }

    if (options.maxPrice && options.maxPrice > 0) {
      query = query.lte('price', options.maxPrice);
    }

    query = query
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (options.limit && options.limit > 0) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Supabase Request Failed] getActiveProducts:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    let products = (data || []) as Product[];

    // Exclude specified IDs if provided (e.g. items already in cart)
    if (options.excludeIds && options.excludeIds.length > 0) {
      const excludeSet = new Set(options.excludeIds);
      const filtered = products.filter(p => !excludeSet.has(p.id));
      // If filtering leaves some products, return them; otherwise return all so user still gets recommendations
      if (filtered.length > 0) {
        products = filtered;
      }
    }

    return products;
  } catch (err) {
    console.error('Error in getActiveProducts:', err);
    throw err;
  }
}

/**
 * Fetches dynamic products specifically for the Cart Free Delivery recommendation section.
 * Reuses the exact same Supabase products table and filtering rules.
 */
export async function getFreeDeliveryRecommendations(excludeIds: string[] = [], limit: number = 10): Promise<Product[]> {
  return getActiveProducts({
    limit,
    excludeIds
  });
}
