import { Router } from "express";
import { getEmailDiagnostics, logEmailDiagnostics } from "../src/lib/emailDiagnostics.js";

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

/**
 * GET /api/debug/email
 * Diagnostic endpoint for verifying Resend email credentials without exposing secrets.
 * Supports optional ?live=true query param to perform live domain verification check with Resend.
 */
router.get("/email", async (req, res) => {
  try {
    const liveCheck = req.query.live === "true" || req.query.live === "1";
    logEmailDiagnostics(`HTTP GET /api/debug/email (liveCheck=${liveCheck})`);
    const diagnostics = await getEmailDiagnostics(liveCheck);
    return res.status(200).json(diagnostics);
  } catch (err: any) {
    console.error("[Email Diagnostics] Error generating report:", err);
    return res.status(500).json({ error: err?.message || "Failed to generate email diagnostics" });
  }
});

export default router;
