import express from "express";
import { Storage } from "@google-cloud/storage";
import aiRoutes from "../routes/aiRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import checkoutRoutes from "../routes/checkoutRoutes.js";
import imageRoutes from "../routes/imageRoutes.js";
import debugRoutes from "./debugRoutes.js";
import rateLimit from "express-rate-limit";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "50mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

app.use("/api/", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/image", imageRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/debug", debugRoutes);

let gcsClient: Storage | null = null;
function getGCS() {
  if (!gcsClient) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (projectId && clientEmail && privateKey) {
      gcsClient = new Storage({
        projectId,
        credentials: { client_email: clientEmail, private_key: privateKey },
      });
    }
  }
  return gcsClient;
}

app.post("/api/notify-verification", async (req, res) => {
  try {
    const { email, verified, businessName, userId } = req.body;
    res.status(200).json({ success: true, message: "Notification sent successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to send notification." });
  }
});

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
    const uniqueFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const bucket = gcs.bucket(bucketName);
    const file = bucket.file(uniqueFileName);
    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000,
      contentType,
    });
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFileName}`;
    res.status(200).json({ signedUrl: url, publicUrl, fileName: uniqueFileName });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

export default app;
