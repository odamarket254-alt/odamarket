-- Supabase Schema for ODA Market

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE inquiry_status AS ENUM ('new', 'contacted', 'closed');
CREATE TYPE notification_type AS ENUM ('inquiry', 'system', 'order');

-- PROFILES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'buyer',
  business_name TEXT,
  company_type TEXT,
  logo_url TEXT,
  cover_image TEXT,
  bio TEXT,
  location TEXT,
  phone TEXT,
  whatsapp TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  moq TEXT, -- Minimum Order Quantity
  status TEXT DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  location TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCT IMAGES
CREATE TABLE product_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INQUIRIES
CREATE TABLE inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  quantity TEXT NOT NULL,
  status inquiry_status DEFAULT 'new',
  buyer_unread_count INTEGER DEFAULT 0,
  seller_unread_count INTEGER DEFAULT 0,
  last_message_text TEXT,
  last_message_time TIMESTAMPTZ,
  last_message_sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- INQUIRY MESSAGES
CREATE TABLE inquiry_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAVORITES
CREATE TABLE favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, product_id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'system',
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view, only self or admin can update
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories: Anyone can view, only admin can insert/update/delete (MVP simplified: everyone reads)
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

-- Products: Anyone can view, only seller owner can insert/update/delete
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Sellers can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own products" ON products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete own products" ON products FOR DELETE USING (auth.uid() = seller_id);

-- Product Images: Anyone can view, only seller owner can manage
CREATE POLICY "Product images are viewable by everyone" ON product_images FOR SELECT USING (true);
CREATE POLICY "Sellers can manage product images" ON product_images FOR ALL USING (
  EXISTS (SELECT 1 FROM products WHERE products.id = product_id AND products.seller_id = auth.uid())
);

-- Inquiries: Seller can view their received inquiries, buyer can view their sent inquiries
CREATE POLICY "Sellers can view received inquiries" ON inquiries FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Buyers can view sent inquiries" ON inquiries FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Buyers can create inquiries" ON inquiries FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Inquiry Messages: Viewable if part of the inquiry
CREATE POLICY "Users can view messages for their inquiries" ON inquiry_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM inquiries WHERE inquiries.id = inquiry_id AND (inquiries.seller_id = auth.uid() OR inquiries.buyer_id = auth.uid()))
);
CREATE POLICY "Users can insert messages" ON inquiry_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM inquiries WHERE inquiries.id = inquiry_id AND (inquiries.seller_id = auth.uid() OR inquiries.buyer_id = auth.uid())) AND sender_id = auth.uid()
);
CREATE POLICY "Users can update read status" ON inquiry_messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM inquiries WHERE inquiries.id = inquiry_id AND (inquiries.seller_id = auth.uid() OR inquiries.buyer_id = auth.uid()))
);

-- Favorites: Only buyers manage their own favorites
CREATE POLICY "Buyers manage own favorites" ON favorites FOR ALL USING (auth.uid() = buyer_id);

-- Notifications: Only owner can view/update
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- FUNCTIONS & TRIGGERS

-- Update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create profile after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'business_name', COALESCE(new.raw_user_meta_data->>'role', 'buyer')::user_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Example Categories Insertion
INSERT INTO categories (name, slug) VALUES 
('Agriculture', 'agriculture'),
('Livestock', 'livestock'),
('Gas Supply', 'gas-supply'),
('Construction Materials', 'construction'),
('Manufacturing', 'manufacturing'),
('Wholesale Products', 'wholesale')
ON CONFLICT (slug) DO NOTHING;

-- Create a storage bucket for category images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'category-images' );

CREATE POLICY "Authenticated users can upload images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'category-images' );

CREATE POLICY "Authenticated users can update images" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'category-images' );

CREATE POLICY "Authenticated users can delete images" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'category-images' );
