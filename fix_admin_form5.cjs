const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminProductFormPage.tsx', 'utf8');

const replacement = `
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description: data.description,
        price: data.regular_price,
        sale_price: data.sale_price,
        stock: data.stock,
        low_stock_threshold: data.min_stock,
        category_id: data.category_id,
        brand_id: data.brand_id || null,
        supplier_id: data.supplier_id || null,
        is_active: data.status === "active",
        is_public: data.status !== "hidden" && data.status !== "archived",
        is_wholesale: data.is_wholesale,
        wholesale_price: data.is_wholesale ? data.wholesale_price : null,
        wholesale_min_qty: data.is_wholesale ? data.wholesale_min_qty : null,
        wholesale_unit: data.is_wholesale ? data.wholesale_unit : null,
        sku: data.sku,
        barcode: data.barcode,
        image_url: images.length > 0 ? images[0] : null,
        updated_at: new Date().toISOString()
`;

content = content.replace(
  /        name: data\.name,[\s\S]*?updated_at: new Date\(\)\.toISOString\(\)/,
  replacement.trim()
);

fs.writeFileSync('src/pages/admin/AdminProductFormPage.tsx', content);
