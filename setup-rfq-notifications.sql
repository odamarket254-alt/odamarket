-- Trigger to notify buyer when a supplier submits a quotation
CREATE OR REPLACE FUNCTION notify_rfq_quotation_received() 
RETURNS TRIGGER AS $$
DECLARE
  v_rfq_title TEXT;
  v_buyer_id UUID;
  v_supplier_name TEXT;
BEGIN
  -- Get RFQ details
  SELECT title, buyer_id INTO v_rfq_title, v_buyer_id FROM public.rfqs WHERE id = NEW.rfq_id;
  
  -- Get supplier name
  SELECT business_name INTO v_supplier_name FROM public.profiles WHERE id = NEW.supplier_id;

  -- Insert notification for buyer
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    v_buyer_id,
    'New Quotation Received',
    'Supplier ' || COALESCE(v_supplier_name, 'A supplier') || ' submitted a quotation for your RFQ: ' || v_rfq_title,
    'system',
    '/buyer/dashboard/rfqs'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_rfq_quotation_inserted
  AFTER INSERT ON public.rfq_responses
  FOR EACH ROW EXECUTE FUNCTION notify_rfq_quotation_received();

-- Trigger to notify seller when their quotation is accepted
CREATE OR REPLACE FUNCTION notify_rfq_quotation_accepted() 
RETURNS TRIGGER AS $$
DECLARE
  v_rfq_title TEXT;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Get RFQ details
    SELECT title INTO v_rfq_title FROM public.rfqs WHERE id = NEW.rfq_id;
    
    -- Insert notification for seller
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.supplier_id,
      'Quotation Accepted!',
      'Your quotation for RFQ: ' || v_rfq_title || ' has been accepted by the buyer.',
      'system',
      '/seller/dashboard/rfqs'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_rfq_quotation_updated
  AFTER UPDATE OF status ON public.rfq_responses
  FOR EACH ROW EXECUTE FUNCTION notify_rfq_quotation_accepted();
