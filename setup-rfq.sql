-- RFQs Table
CREATE TABLE IF NOT EXISTS public.rfqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    target_price NUMERIC,
    delivery_location TEXT NOT NULL,
    delivery_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'quoted', 'negotiating', 'accepted', 'rejected', 'closed')),
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFQ Responses (Quotations) Table
CREATE TABLE IF NOT EXISTS public.rfq_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rfq_id UUID REFERENCES public.rfqs(id) ON DELETE CASCADE NOT NULL,
    supplier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quoted_price NUMERIC NOT NULL,
    moq NUMERIC NOT NULL,
    lead_time_days INTEGER NOT NULL,
    delivery_terms TEXT,
    payment_terms TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'negotiating')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_responses ENABLE ROW LEVEL SECURITY;

-- Policies for rfqs

-- Buyers can see their own RFQs
CREATE POLICY "Buyers can view their own RFQs" ON public.rfqs
  FOR SELECT USING (auth.uid() = buyer_id);

-- Sellers can see RFQs (in a real system, you might restrict to category or assigned, but for now we let sellers see pending/active RFQs to quote on them)
CREATE POLICY "Sellers can view active RFQs" ON public.rfqs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller'
    ) 
    AND status IN ('pending', 'quoted', 'negotiating')
  );

-- Buyers can insert their own RFQs
CREATE POLICY "Buyers can create RFQs" ON public.rfqs
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update their own RFQs
CREATE POLICY "Buyers can update their own RFQs" ON public.rfqs
  FOR UPDATE USING (auth.uid() = buyer_id);

-- Policies for rfq_responses

-- Buyers can see responses for their RFQs
CREATE POLICY "Buyers can view responses to their RFQs" ON public.rfq_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM rfqs WHERE id = rfq_responses.rfq_id AND buyer_id = auth.uid()
    )
  );

-- Sellers can see their own responses
CREATE POLICY "Sellers can view their own responses" ON public.rfq_responses
  FOR SELECT USING (auth.uid() = supplier_id);

-- Sellers can create responses
CREATE POLICY "Sellers can create responses" ON public.rfq_responses
  FOR INSERT WITH CHECK (
    auth.uid() = supplier_id 
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller'
    )
  );

-- Sellers can update their own responses
CREATE POLICY "Sellers can update their own responses" ON public.rfq_responses
  FOR UPDATE USING (auth.uid() = supplier_id);

-- Buyers can update responses (e.g., accept/reject)
CREATE POLICY "Buyers can accept/reject responses" ON public.rfq_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM rfqs WHERE id = rfq_responses.rfq_id AND buyer_id = auth.uid()
    )
  );

-- Enable realtime
alter publication supabase_realtime add table rfqs;
alter publication supabase_realtime add table rfq_responses;
