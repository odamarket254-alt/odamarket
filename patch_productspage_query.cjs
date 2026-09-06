const fs = require('fs');

let code = fs.readFileSync('src/pages/ProductsPage.tsx', 'utf8');

// Replace the metadata fetching logic
code = code.replace(/const \[allCategories, setAllCategories\][\s\S]*?fetchMetadata\(\);\s*\}, \[\]\);/m, 
`const { data: metadata, isLoading: metadataLoading } = useQuery({
    queryKey: ['products-metadata'],
    queryFn: async () => {
      const [catsRes, brandsRes, rpcRes] = await Promise.all([
        supabase.from("categories").select("id, name, slug").eq("is_active", true).order("name"),
        supabase.from("brands").select("id, name, slug").eq("is_active", true).order("name"),
        supabase.rpc("get_product_aggregates")
      ]);
      
      let categoryCounts = {};
      let brandCounts = {};
      let priceBounds = { min: 0, max: 10000 };
      
      if (rpcRes.data) {
        categoryCounts = rpcRes.data.category_counts || {};
        brandCounts = rpcRes.data.brand_counts || {};
        priceBounds = {
          min: rpcRes.data.min_price ? Math.floor(rpcRes.data.min_price) : 0,
          max: rpcRes.data.max_price ? Math.ceil(rpcRes.data.max_price) : 10000
        };
      }
      
      return {
        categories: catsRes.data || [],
        brands: brandsRes.data || [],
        categoryCounts,
        brandCounts,
        priceBounds
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const allCategories = metadata?.categories || [];
  const allBrands = metadata?.brands || [];
  const categoryCounts = metadata?.categoryCounts || {};
  const brandCounts = metadata?.brandCounts || {};
  const priceBounds = metadata?.priceBounds || { min: 0, max: 10000 };
`);

// Add useQuery import if not exists
if (!code.includes('useQuery')) {
  code = code.replace(/import { useState, useEffect, useMemo, useCallback } from "react";/, 
    'import { useState, useEffect, useMemo, useCallback } from "react";\nimport { useQuery } from "@tanstack/react-query";');
}

fs.writeFileSync('src/pages/ProductsPage.tsx', code);
