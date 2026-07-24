#!/bin/bash
TMPFILE=$(mktemp)
cat << 'DROP_SQL' > "$TMPFILE"
-- Drop existing tables to avoid conflicts
DROP TABLE IF EXISTS 
departments, categories, subcategories, product_types, brands, suppliers, 
attributes, attribute_values, product_type_attributes, products, product_variants, 
product_images, product_attributes, supplier_products, warehouses, inventory, 
inventory_movements, roles, permissions, role_permissions, customers, customer_addresses, 
orders, order_items, payments, coupons, coupon_usage, reviews, notifications, 
audit_logs, activity_logs, wishlists, cart_items, banners, campaigns, seo_metadata, 
settings, tax_rates, shipping_zones, shipping_methods, currencies CASCADE;

DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_stats CASCADE;

DROP_SQL
cat database_schema.sql >> "$TMPFILE"
mv "$TMPFILE" database_schema.sql
