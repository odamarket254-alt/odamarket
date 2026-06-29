import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Storage } from "@google-cloud/storage";
import multer from "multer";
import aiRoutes from "./routes/aiRoutes.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Initialize Google Cloud Storage client lazily
let gcsClient: Storage | null = null;

function getGCS() {
  if (!gcsClient) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      gcsClient = new Storage({
        projectId,
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
      });
    } else {
      console.warn("Google Cloud Storage credentials are not fully configured in environment variables.");
    }
  }
  return gcsClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" })); // Increase limit for file uploads

  // AI Routes
  app.use("/api/ai", aiRoutes);

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

  // Generate a Signed URL for direct client-side upload to GCS
  app.post("/api/gcs/generate-upload-url", async (req, res) => {
    try {
      const gcs = getGCS();
      const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;

      if (!gcs || !bucketName) {
        return res.status(500).json({ error: "Google Cloud Storage is not fully configured." });
      }

      const { fileName, contentType } = req.body;
      if (!fileName || !contentType) {
        return res.status(400).json({ error: "fileName and contentType are required" });
      }

      // Prepend timestamp to ensure unique filename
      const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const bucket = gcs.bucket(bucketName);
      const file = bucket.file(uniqueFileName);

      // Generate signed URL (expires in 15 minutes)
      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType,
      });

      // Provide the url for upload and the public url for accessing later
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFileName}`;

      res.status(200).json({ signedUrl: url, publicUrl, fileName: uniqueFileName });
    } catch (error) {
      console.error("Signed URL generation failed:", error);
      res.status(500).json({ error: "Failed to generate signed URL" });
    }
  });

  // Optional: Direct backend proxy upload via multer
  app.post("/api/gcs/upload", upload.single("file"), async (req, res) => {
    try {
      const gcs = getGCS();
      const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;

      if (!gcs || !bucketName) {
        return res.status(500).json({ error: "Google Cloud Storage is not fully configured." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      const bucket = gcs.bucket(bucketName);
      const originalName = req.file.originalname;
      const uniqueFileName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const file = bucket.file(uniqueFileName);

      const stream = file.createWriteStream({
        resumable: false,
        contentType: req.file.mimetype,
      });

      stream.on("error", (err) => {
        console.error("GCS Upload Error:", err);
        res.status(500).json({ error: "Failed to upload to Google Cloud Storage" });
      });

      stream.on("finish", () => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFileName}`;
        res.status(200).json({ success: true, url: publicUrl, fileName: uniqueFileName });
      });

      stream.end(req.file.buffer);
    } catch (error) {
      console.error("Upload proxy error:", error);
      res.status(500).json({ error: "Upload process failed" });
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

  // Global Error Handler for API routes to prevent HTML responses
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.originalUrl.startsWith("/api")) {
      console.error("API Error:", err);
      res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
    } else {
      next(err);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
