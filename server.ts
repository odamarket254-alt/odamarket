import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/enhance-inquiry", async (req, res) => {
    try {
      const { message, quantity } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API integration missing." });
      }

      // @google/genai initialization
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const prompt = `You are an AI assistant inside ODA Market, an African B2B marketplace connecting buyers with suppliers, wholesalers, and manufacturers.

Your role is to help buyers create professional, detailed, and business-focused inquiries to suppliers.

When a buyer provides a short or unclear request, transform it into a professional inquiry message suitable for B2B communication.

Your response must:
* Sound professional and trustworthy
* Be concise but detailed
* Include product quantity if mentioned
* Include delivery location if mentioned
* Include quality/specification requests
* Include preferred pricing or quotation request
* Encourage supplier response
* Be formatted clearly

The tone should feel:
* Professional
* Polite
* Business-oriented
* African B2B marketplace style

Examples of buyer input:
* "need 50 gas cylinders"
* "looking for maize flour supplier"

Example output:
Subject: Inquiry for 50 Gas Cylinders

Hello,

I hope you are well.

I am interested in purchasing 50 gas cylinders for business use. Kindly share your pricing, available cylinder sizes, delivery timelines, and payment terms.

Please also provide information regarding product quality, warranty (if applicable), and delivery options.

Looking forward to your quotation and further discussion.

Thank you.

Rules:
* Never generate fake promises
* Never create unrealistic quantities
* Never include spammy language
* Keep the inquiry professional
* Improve grammar automatically
* If important information is missing, intelligently structure the inquiry professionally
* Only return the inquiry text/subject, do not add any additional assistant commentary.

Buyer request: "${message}"${quantity ? ` (User also indicated quantity: ${quantity})` : ""}`;

      let response;
      let retriesEnhance = 3;
      while (retriesEnhance > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });
          break;
        } catch (error: any) {
          if (error?.status === 503 && retriesEnhance > 1) {
            retriesEnhance--;
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw error;
        }
      }

      return res.json({ enhancedMessage: response?.text || "" });
    } catch (error) {
      console.error("Gemini API Error:", error);
      return res.status(500).json({ error: "Failed to enhance inquiry." });
    }
  });

  app.post("/api/generate-quotation", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message/details required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API integration missing." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const prompt = `You are an AI quotation assistant for ODA Market, a professional African B2B marketplace.

Your role is to help suppliers generate professional quotations and responses to buyer inquiries.

When the seller provides product information, generate a clear, business-quality quotation message.

The quotation should include:
* Greeting
* Product details
* Quantity
* Unit pricing
* Total pricing
* Delivery timelines
* Payment terms
* Contact encouragement
* Professional closing

The tone should feel:
* Professional
* Trustworthy
* Supplier-grade
* Clean and structured

Example input:
* 50 gas cylinders at KSh 7,500 each delivery in 3 days

Example output:
Subject: Quotation for 50 Gas Cylinders

Dear Customer,

Thank you for your inquiry.

Please find our quotation below:

Product: Gas Cylinders
Quantity: 50 Units
Unit Price: KSh 7,500
Total Amount: KSh 375,000

Delivery Timeline:
Delivery can be completed within 3 business days after payment confirmation.

Payment Terms:
50% deposit before delivery and balance upon completion.

Please let us know if you would like to proceed or require additional information.

Thank you for choosing ODA Market.

Best regards,
[Supplier Name]

Rules:
* Always calculate totals correctly
* Keep formatting clean
* Use professional B2B language
* Never use casual language
* Improve grammar automatically
* Make the seller appear trustworthy and organized
* Only return the quotation text/subject, do not add any additional assistant commentary.

Seller's raw details: "${message}"`;

      let response;
      let retriesQuote = 3;
      while (retriesQuote > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });
          break;
        } catch (error: any) {
          if (error?.status === 503 && retriesQuote > 1) {
            retriesQuote--;
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw error;
        }
      }

      return res.json({ quotation: response?.text || "" });
    } catch (error) {
      console.error("Gemini API Error:", error);
      return res.status(500).json({ error: "Failed to generate quotation." });
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
