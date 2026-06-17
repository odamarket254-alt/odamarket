export type RFQStatus = 'draft' | 'pending' | 'quoted' | 'negotiating' | 'accepted' | 'rejected' | 'closed';

export type RFQResponseStatus = 'pending' | 'accepted' | 'rejected' | 'negotiating';

export interface RFQ {
  id: string;
  buyer_id: string;
  product_id?: string | null;
  category_id?: string | null;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  target_price?: number | null;
  delivery_location: string;
  delivery_date?: string | null;
  status: RFQStatus;
  attachments?: string[] | null;
  created_at: string;
  updated_at: string;
  
  // Relations (optional based on join)
  buyer?: any;
  product?: any;
  category?: any;
  responses?: RFQResponse[];
}

export interface RFQResponse {
  id: string;
  rfq_id: string;
  supplier_id: string;
  quoted_price: number;
  moq: number;
  lead_time_days: number;
  delivery_terms?: string | null;
  payment_terms?: string | null;
  message?: string | null;
  status: RFQResponseStatus;
  created_at: string;
  updated_at: string;
  
  // Relations
  rfq?: RFQ;
  supplier?: any;
}
