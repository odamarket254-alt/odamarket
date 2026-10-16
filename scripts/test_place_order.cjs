const puppeteer = require("puppeteer");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

async function run() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminSupabase = createClient(supabaseUrl, serviceKey);

  const { data: products } = await adminSupabase.from("products").select("*").gt("stock", 5).limit(1);
  const product = products[0];

  const email = "odamarket254@gmail.com";
  const { data: linkData, error: linkErr } = await adminSupabase.auth.admin.generateLink({
    type: "magiclink",
    email: email
  });
  if (linkErr) {
    console.error("Link error:", linkErr);
    process.exit(1);
  }

  const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
  const { data: verifyData, error: verifyErr } = await anonSupabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink"
  });
  const session = verifyData.session;
  console.log("Got session for:", email);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  page.on("console", msg => {
    console.log(`[BROWSER ${msg.type()}]:`, msg.text());
  });

  page.on("pageerror", err => {
    console.error("[PAGEERROR]:", err.message, err.stack);
  });

  page.on("requestfailed", req => {
    console.log("[REQ FAILED]:", req.url(), req.failure()?.errorText);
  });

  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });

  await page.evaluate(({ session, product }) => {
    const allKeys = Object.keys(localStorage);
    let authKey = allKeys.find(k => k.endsWith("-auth-token")) || "sb-vjzgqhsvgknmnjpaefvy-auth-token";
    localStorage.setItem(authKey, JSON.stringify(session));
    localStorage.setItem("sb-vjzgqhsvgknmnjpaefvy-auth-token", JSON.stringify(session));
    localStorage.setItem("supabase.auth.token", JSON.stringify(session));

    const cartState = {
      state: {
        items: [{
          id: product.id,
          name: product.name,
          price: String(product.sale_price || product.price),
          image_url: product.image_url || "",
          quantity: 1
        }],
        deliveryMethod: "standard"
      },
      version: 0
    };
    localStorage.setItem("oda-cart-storage", JSON.stringify(cartState));
  }, { session, product });

  console.log("Navigating to /checkout...");
  await page.goto("http://localhost:3000/checkout", { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));

  console.log("Clicking Place Order button...");
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn = buttons.find(b => b.textContent && (b.textContent.includes("Place Order") || b.textContent.includes("Retry Payment")));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log("Button clicked:", clicked);

  await new Promise(r => setTimeout(r, 6000));

  const toasts = await page.evaluate(() => {
    // react-hot-toast or sonner or toast elements
    const elements = Array.from(document.querySelectorAll('[role="status"], [role="alert"], .toast, [data-sonner-toast]'));
    return elements.map(el => el.textContent);
  });
  console.log("Toasts found:", toasts);

  await browser.close();
}

run().catch(console.error);
