import { Router } from "express";

const router = Router();

router.get("/env", (req, res) => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  res.json({
    supabaseUrl: {
      exists: !!url,
      length: url.length,
      startsWith: url.substring(0, 8),
      hasQuotes: url.startsWith('"') || url.endsWith('"')
    },
    anonKey: {
      exists: !!anonKey,
      length: anonKey.length,
      startsWith: anonKey.substring(0, 5),
      hasQuotes: anonKey.startsWith('"') || anonKey.endsWith('"')
    },
    serviceKey: {
      exists: !!serviceKey,
      length: serviceKey.length,
      startsWith: serviceKey.substring(0, 5),
      hasQuotes: serviceKey.startsWith('"') || serviceKey.endsWith('"')
    }
  });
});

export default router;
