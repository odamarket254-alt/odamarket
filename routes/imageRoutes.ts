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

    // Attempt to determine best format based on Accept headers
    const accepts = req.headers.accept || "";
    let format: "jpeg" | "webp" | "avif" = "jpeg";
    
    // Fallbacks if browser doesn't explicitly advertise avif/webp 
    // or if the underlying OS doesn't have AVIF support, we can try to rely on sharp defaults.
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

    // Fetch the original image
    const response = await fetch(url);
    if (!response.ok) {
       return res.redirect(url); // gracefully degrade to original image if fetch fails
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
    console.error("Image proxy error:", err);
    // fallback gracefully to original url if possible
    if (typeof req.query.url === "string") {
      res.redirect(req.query.url);
    } else {
      res.status(500).send("Optimization failed");
    }
  }
});

export default router;
