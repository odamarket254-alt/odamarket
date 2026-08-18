import dotenv from 'dotenv';
dotenv.config();

let key = (process.env.AFRICASTALKING_API_KEY || "").trim().replace(/^["']|["']$/g, "");
let user = (process.env.AFRICASTALKING_USERNAME || "").trim().replace(/^["']|["']$/g, "");
let sender = (process.env.AFRICASTALKING_SENDER_ID || "").trim().replace(/^["']|["']$/g, "");

import AfricasTalking from 'africastalking';

async function test() {
  const at = AfricasTalking({ apiKey: key, username: user });
  
  try {
    const res = await at.SMS.send({
      to: ['+254722000000'],
      message: 'OdaMarket SMS Test',
      from: sender || undefined
    });
    console.log("Success Response:", JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.log("Error Response:", err.message || err);
  }
}

test();
