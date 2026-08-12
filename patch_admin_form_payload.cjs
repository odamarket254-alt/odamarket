const fs = require('fs');

const orig = `
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        description: data.description,
        price: data.regular_price,
        stock: data.stock,
        category_id: data.category_id,
        is_active: data.status === "active",
        is_public: data.status !== "hidden" && data.status !== "archived",
        // is_wholesale: data.is_wholesale,
        wholesale_price: data.is_wholesale ? data.wholesale_price : null,
        wholesale_min_qty: data.is_wholesale ? data.wholesale_min_qty : null,
        wholesale_unit: data.is_wholesale ? data.wholesale_unit : null,
        sku: data.sku,
        barcode: data.barcode,
        image_url: images.length > 0 ? images[0] : null,
        updated_at: new Date().toISOString()
`;
// I added sale_price, low_stock_threshold, brand_id, supplier_id, is_wholesale

