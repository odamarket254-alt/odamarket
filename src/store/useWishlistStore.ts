import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  product_id: string;
  products: any;
}

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  initialized: boolean;
  fetchWishlist: (userId: string) => Promise<void>;
  toggleWishlist: (userId: string, productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,
  initialized: false,

  fetchWishlist: async (userId: string) => {
    if (!userId) return;
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('id, product_id, products(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Error Loading Wishlist:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return;
      }
      set({ items: data || [], initialized: true });
    } catch (err) {
      console.error("Unexpected error loading wishlist:", err);
    } finally {
      set({ loading: false });
    }
  },

  toggleWishlist: async (userId: string, productId: string) => {
    if (!userId) {
      toast.error("Please login to manage your wishlist");
      return;
    }

    const { items } = get();
    const existingItem = items.find(item => item.product_id === productId);

    if (existingItem) {
      // Remove
      set({ items: items.filter(item => item.product_id !== productId) });
      try {
        const { error } = await supabase
          .from('wishlist_items')
          .delete()
          .eq('id', existingItem.id);

        if (error) {
          console.error("Supabase Error Removing Wishlist Item:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          // Revert on error
          set({ items });
          toast.error("Failed to remove item from wishlist");
          return;
        }
        toast.success("Removed from wishlist");
      } catch (err) {
        set({ items });
        console.error("Unexpected error removing wishlist item:", err);
        toast.error("Failed to remove item");
      }
    } else {
      // Optimistic Add (without full product info, we'll refetch or insert minimal)
      try {
        const { data, error } = await supabase
          .from('wishlist_items')
          .insert([{ user_id: userId, product_id: productId }])
          .select('id, product_id, products(*)')
          .single();

        if (error) {
          console.error("Supabase Error Adding Wishlist Item:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          toast.error("Failed to add to wishlist");
          return;
        }

        set({ items: [data, ...items] });
        toast.success("Added to wishlist");
      } catch (err) {
        console.error("Unexpected error adding wishlist item:", err);
        toast.error("Failed to add to wishlist");
      }
    }
  },

  isInWishlist: (productId: string) => {
    return get().items.some(item => item.product_id === productId);
  },

  clearWishlist: () => set({ items: [], initialized: false })
}));
