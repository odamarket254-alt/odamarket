import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

let aiClient: GoogleGenAI | null = null;

export function getAI() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const SYSTEM_PROMPT = `You are OdaMarket AI, a professional procurement assistant for a B2B marketplace.

Your responsibilities include:
* Helping buyers find suppliers using only the supplied database results.
* Helping suppliers write professional quotations.
* Helping buyers write RFQs.
* Improving inquiry quality.
* Answering procurement questions.
* Maintaining a professional, concise, and business-focused tone.
* Never invent suppliers, prices, or company information.

CRITICAL INSTRUCTION FOR QUOTATIONS:
Whenever a supplier pastes a buyer's RFQ or inquiry, you MUST IMMEDIATELY generate a complete, professional quotation draft. 
DO NOT ask for more information.
DO NOT ask the supplier questions.
DO NOT tell the supplier to provide quantities.
DO NOT explain what information is missing.

If information is missing, leave editable placeholders as specified below. Never stop the quotation generation.

Use the following exact format for the quotation:
---
# QUOTATION
**Supplier:** [Supplier Company Name]
**Address:** [Address or "To be confirmed"]
**Phone:** [Phone or "To be confirmed"]
**Email:** [Email or "To be confirmed"]
**Website:** [Website or "To be confirmed"]
---
**Quotation No.:** Auto Generate
**Date:** Today's Date
**Buyer:** [If available]
**RFQ Reference:** [If available]
---
## Subject
Quotation for Supply of Requested Products
---
## Dear Customer,
Thank you for your inquiry.
We are pleased to submit the following quotation for your consideration.
---
## Items
| No. | Product | Description | Qty | Unit | Unit Price | Total |
|---|---|---|---|---|---|---|
| 1 | [Extracted Product] | [Extracted Specs] | [Extracted Qty or "To be confirmed"] | [Unit] | ________ | ________ |

(Extract EVERY requested product automatically. Do not summarize. Create ONE ROW for EVERY product. If quantities are missing, write "To be confirmed". Leave Unit Price and Total as "________".)
---
## Totals
**Subtotal:** ________
**VAT:** ________
**Delivery Charges:** ________
**Grand Total:** ________
---
## Terms and Conditions
**Delivery Terms:** [Extracted Deadline or "To be confirmed"]
**Payment Terms:** ________
**Validity:** This quotation is valid for 30 days.
**Warranty:** Where applicable.
**Notes:** Thank you for your business.
---
**Authorized Signature:** ___________________________
---

Smart Features:
* Extract products automatically.
* Detect quantities.
* Detect specifications.
* Detect delivery locations.
* Detect deadlines.
* Detect buyer requirements.
* Leave unknown values as "________" or "To be confirmed" instead of asking questions.
* Never stop to ask for more information before producing the quotation.`;

async function generateContentWithFallback(contents: any[], config: any = {}) {
  const ai = getAI();
  const mergedConfig = { systemInstruction: SYSTEM_PROMPT, ...config };

  try {
    return await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: mergedConfig,
    });
  } catch (error: any) {
    if (error?.status === 404 || (error?.message && error.message.includes("not found"))) {
      console.warn("[AI Service] gemini-2.5-flash not found, falling back to gemini-2.0-flash");
      return await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents,
        config: mergedConfig,
      });
    }
    throw error;
  }
}

// Tools
const searchProductsFunction: FunctionDeclaration = {
  name: "searchProducts",
  description: "Search for products in the OdaMarket database.",
  parameters: {
    type: Type.OBJECT,
    properties: { query: { type: Type.STRING } },
    required: ["query"],
  },
};

const getSupplierProfileFunction: FunctionDeclaration = {
  name: "getSupplierProfile",
  description: "Get details about a supplier in the OdaMarket database.",
  parameters: {
    type: Type.OBJECT,
    properties: { query: { type: Type.STRING } },
    required: ["query"],
  },
};

const generateRFQFunction: FunctionDeclaration = {
  name: "generateRFQ",
  description: "Generate a professional Request for Quotation (RFQ).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      product: { type: Type.STRING },
      quantity: { type: Type.STRING },
      deliveryLocation: { type: Type.STRING },
      budget: { type: Type.STRING },
      deadline: { type: Type.STRING },
      requirements: { type: Type.STRING },
    },
    required: ["product", "quantity"],
  },
};

export const geminiService = {
  async chat(messages: any[], fileData?: { mimeType: string; data: string }) {
    const contents: any[] = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    if (fileData && contents.length > 0) {
      const lastMsg = contents[contents.length - 1];
      if (lastMsg.role === 'user') {
        lastMsg.parts.unshift({
          inlineData: { mimeType: fileData.mimeType, data: fileData.data },
        });
      }
    }

    const tools = [{ functionDeclarations: [searchProductsFunction, getSupplierProfileFunction, generateRFQFunction] }];
    let isDone = false;
    let finalResponse = "";
    let currentContents = [...contents];
    let iterations = 0;
    
    while (!isDone && iterations < 3) {
      iterations++;
      const response = await generateContentWithFallback(currentContents, { tools });

      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        currentContents.push(response.candidates?.[0]?.content);
        const functionResponses: any[] = [];
        
        for (const call of functionCalls) {
          try {
            if (call.name === "searchProducts") {
              const args = call.args as any;
              const { data, error } = await supabase
                .from("products")
                .select("id, title, description, price, location, moq")
                .ilike("title", `%${args.query}%`)
                .limit(5);
              functionResponses.push({ name: call.name, response: { result: error ? "Error searching" : data || [] } });
            } else if (call.name === "getSupplierProfile") {
              const args = call.args as any;
              const { data, error } = await supabase
                .from("profiles")
                .select("id, business_name, location, verified, bio")
                .eq("role", "seller")
                .ilike("business_name", `%${args.query}%`)
                .limit(5);
              functionResponses.push({ name: call.name, response: { result: error ? "Error searching" : data || [] } });
            } else if (call.name === "generateRFQ") {
              const args = call.args as any;
              const rfqTemplate = `**REQUEST FOR QUOTATION (RFQ)**\n\n**Product:** ${args.product}\n**Quantity:** ${args.quantity}\n**Delivery Location:** ${args.deliveryLocation || "To be confirmed"}\n**Budget:** ${args.budget || "Open for competitive pricing"}\n**Required Deadline:** ${args.deadline || "ASAP"}\n**Specific Requirements:** ${args.requirements || "Standard commercial quality"}\n\n*Please provide your best quotation including delivery costs and VAT if applicable.*`;
              functionResponses.push({ name: call.name, response: { result: rfqTemplate } });
            }
          } catch (e) {
            functionResponses.push({ name: call.name, response: { error: "Execution failed" } });
          }
        }
        
        currentContents.push({
          role: "user",
          parts: functionResponses.map(fr => ({ functionResponse: fr }))
        });
      } else {
        isDone = true;
        finalResponse = response.text || "";
      }
    }
    return finalResponse;
  },

  async replyInquiry(contextMessages: any[], myRole: string) {
    const contents: any[] = contextMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    contents.push({
      role: 'user',
      parts: [{ text: `Please generate 3 professional reply options for me (${myRole}) to send next. Output strictly as a JSON array of strings.` }]
    });

    const response = await generateContentWithFallback(contents, { responseMimeType: "application/json" });
    return response.text || "[]";
  },

  async writeRfq(details: string) {
    const contents = [{ role: 'user', parts: [{ text: `Please draft a professional Request for Quotation (RFQ) based on these details: ${details}` }] }];
    const response = await generateContentWithFallback(contents);
    return response.text || "";
  },

  async supplierSearch(query: string) {
    // Search the database first
    const { data: suppliers, error } = await supabase
      .from("profiles")
      .select("id, business_name, location, verified, bio")
      .eq("role", "seller")
      .ilike("business_name", `%${query}%`)
      .limit(10);
      
    if (error || !suppliers || suppliers.length === 0) {
       return "No matching suppliers are currently available. Could you try refining your search keywords?";
    }

    const contents = [{ 
      role: 'user', 
      parts: [{ text: `I am looking for "${query}". Here are the matching suppliers from our database: ${JSON.stringify(suppliers)}. Please organize, explain, compare, and recommend the best options from this list in a professional manner. Do not invent any other suppliers.` }] 
    }];
    
    const response = await generateContentWithFallback(contents);
    return response.text || "";
  }
};
