import { Request, Response } from "express";
import { geminiService } from "../services/geminiService.js";

export const aiController = {
  async chat(req: Request, res: Response) {
    try {
      const { messages, file } = req.body;
      const responseText = await geminiService.chat(messages, file);
      res.status(200).json({ text: responseText });
    } catch (error: any) {
      console.warn(`[AI Controller] Chat API error. Status: ${error?.status || 'None'}, Message: ${error?.message || 'Unknown error'}`);
      
      if (error?.status === 429 || (error?.message && error.message.includes("429"))) {
        if (error?.message && error.message.includes("limit: 0")) {
          return res.status(200).json({ text: "The AI service is unavailable because the free tier is not supported in this region, or billing needs to be enabled for this project. Please configure a paid API key or check your Google Cloud billing settings." });
        }
        return res.status(200).json({ text: "I'm currently receiving a high volume of requests (rate limited). Please wait a moment and try your request again." });
      }

      if (error?.status === 503 || (error?.message && error.message.includes("503"))) {
         return res.status(200).json({ text: "I'm currently experiencing high demand and am temporarily overloaded. Please try again in a few moments." });
      }

      res.status(200).json({ text: "I'm currently unable to process your request due to high demand or a technical issue. Please try again later or contact support if this continues." });
    }
  },

  async replyInquiry(req: Request, res: Response) {
    try {
      const { messages, role } = req.body;
      const responseText = await geminiService.replyInquiry(messages, role);
      res.status(200).json({ text: responseText });
    } catch (error: any) {
      console.warn(`[AI Controller] Reply Inquiry error. Status: ${error?.status || 'None'}, Message: ${error?.message || 'Unknown error'}`);
      const fallbackReplies = [
        "Thank you for your message. Let me review this and get back to you shortly.",
        "I appreciate the details. I will look into it and follow up as soon as possible.",
        "Could you please provide a bit more context so I can give you the most accurate response?"
      ];
      res.status(200).json({ text: JSON.stringify(fallbackReplies) });
    }
  },

  async writeRfq(req: Request, res: Response) {
    try {
      const { details } = req.body;
      const responseText = await geminiService.writeRfq(details);
      res.status(200).json({ text: responseText });
    } catch (error: any) {
      console.warn(`[AI Controller] Write RFQ error. Status: ${error?.status || 'None'}, Message: ${error?.message || 'Unknown error'}`);
      res.status(200).json({ text: "Error: Unable to generate RFQ at this time. Please try again later." });
    }
  },

  async supplierSearch(req: Request, res: Response) {
    try {
      const { query } = req.body;
      const responseText = await geminiService.supplierSearch(query);
      res.status(200).json({ text: responseText });
    } catch (error: any) {
      console.warn(`[AI Controller] Supplier Search error. Status: ${error?.status || 'None'}, Message: ${error?.message || 'Unknown error'}`);
      res.status(200).json({ text: "Error: Unable to complete supplier search at this time. Please try again later." });
    }
  }
};
