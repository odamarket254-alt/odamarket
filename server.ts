import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Edge Function / Notification Endpoint
  app.post("/api/notify-verification", async (req, res) => {
    try {
      const { email, verified, businessName, userId } = req.body;
      
      // Log the notification to standard output
      // In a real production system, you would integrate Resend, Postmark, or SendGrid here
      console.log(`\n[EMAIL EDGE FUNCTION] 🚀 Triggered verification alert for user ${userId}`);
      console.log(`[EMAIL EDGE FUNCTION] 📧 To: ${email || "User's Registered Address"}`);
      console.log(`[EMAIL EDGE FUNCTION] 📝 Subject: Account Verification Update`);
      console.log(`[EMAIL EDGE FUNCTION] ✉️ Body: Hello ${businessName || "Valued Member"},\n\nYour account has been officially ${verified ? "verified" : "unverified"} by the marketplace administrators.\n\nThank you for using ODA Market.`);

      res.status(200).json({ success: true, message: "Notification sent successfully." });
    } catch (error) {
      console.error("Failed to send notification:", error);
      res.status(500).json({ error: "Failed to send notification." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa", // Handles SPA frontend routing fallback automatically in dev
    });
    app.use(vite.middlewares);

    // Explicit fallback for deep links in development just in case
    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      
      try {
        const fs = await import("fs/promises");
        let template = await fs.readFile(path.join(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production frontend serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback handling
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
