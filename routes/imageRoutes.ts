import { Router } from "express";
import sharp from "sharp";

const router = Router();

// A simple in-memory LRU cache map. Limit to 100 entries.
// Each entry might be ~50-100KB, so 100 entries = 5-10MB which is very light.
const imageCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 100;

router.get("/", async (req, res) => {
  try {
    const url = req.query.url as string;
    const w = parseInt(req.query.w as string) || 800;
    const q = parseInt(req.query.q as string) || 80;

    if (!url) {
      return res.status(400).send("URL is required");
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).send("Invalid protocol");
      }
    } catch {
      return res.status(400).send("Invalid URL");
    }

    // Attempt to determine best format based on Accept headers
    const accepts = req.headers.accept || "";
    let format: "jpeg" | "webp" | "avif" = "jpeg";
    
    if (accepts.includes("image/avif")) {
      format = "avif";
    } else if (accepts.includes("image/webp")) {
      format = "webp";
    }

    const cacheKey = `${url}-${w}-${q}-${format}`;
    
    if (imageCache.has(cacheKey)) {
      // Refresh LRU
      const cached = imageCache.get(cacheKey)!;
      imageCache.delete(cacheKey);
      imageCache.set(cacheKey, cached);
      
      res.setHeader("Content-Type", `image/${format}`);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.send(cached);
    }

    // Fetch the original image with 5-second timeout to prevent hanging
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) {
       return res.redirect(302, url); // gracefully degrade to original image if fetch fails
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize
    const optimized = await sharp(buffer)
      .resize(w, null, { withoutEnlargement: true })
      .toFormat(format, { quality: q })
      .toBuffer();

    // Store in cache
    if (imageCache.size >= MAX_CACHE_SIZE) {
      // Remove first (oldest) entry
      const firstKey = imageCache.keys().next().value;
      if (firstKey) imageCache.delete(firstKey);
    }
    imageCache.set(cacheKey, optimized);

    res.setHeader("Content-Type", `image/${format}`);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return res.send(optimized);
  } catch (err) {
    console.error("[Image Proxy Error]", err);
    // fallback gracefully to original url if possible
    if (typeof req.query.url === "string" && (req.query.url.startsWith('http://') || req.query.url.startsWith('https://'))) {
      if (!res.headersSent) {
        return res.redirect(302, req.query.url);
      }
    } else {
      if (!res.headersSent) {
        return res.status(500).send("Optimization failed");
      }
    }
  }
});

export default router;
