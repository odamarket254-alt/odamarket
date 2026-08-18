import dotenv from 'dotenv';
dotenv.config();

const AFRICASTALKING_API_KEY = process.env.AFRICASTALKING_API_KEY;
const AFRICASTALKING_USERNAME = process.env.AFRICASTALKING_USERNAME;
const AFRICASTALKING_SENDER_ID = process.env.AFRICASTALKING_SENDER_ID;

console.log("Environment Variables:");
console.log("AFRICASTALKING_API_KEY:", AFRICASTALKING_API_KEY ? `Set (Length: ${AFRICASTALKING_API_KEY.length})` : "NOT SET");
console.log("AFRICASTALKING_USERNAME:", AFRICASTALKING_USERNAME || "NOT SET");
console.log("AFRICASTALKING_SENDER_ID:", AFRICASTALKING_SENDER_ID || "NOT SET");

import AfricasTalking from 'africastalking';

async function test() {
  if (!AFRICASTALKING_API_KEY || !AFRICASTALKING_USERNAME) {
    console.log("Missing credentials, cannot test AT");
    return;
  }
  
  const at = AfricasTalking({ apiKey: AFRICASTALKING_API_KEY, username: AFRICASTALKING_USERNAME });
  
  try {
    const res = await at.SMS.send({
      to: ['+254722000000'], // Use a dummy number to just see if auth works or if it fails before that
      message: 'OdaMarket SMS Test',
      from: AFRICASTALKING_SENDER_ID || undefined
    });
    console.log("Success Response:", JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.log("Error Response:", err.message || err);
    console.log("Full error:", JSON.stringify(err, null, 2));
  }
}

test();
