const fs = require('fs');
let code = fs.readFileSync('emailService.ts', 'utf8');

code = code.replace(
  "const resend = new Resend(process.env.RESEND_API_KEY);",
  `let resend: Resend | null = null;
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}`
);

code = code.replace(
  "const data = await resend.emails.send({",
  `const resendClient = getResend();
    if (!resendClient) {
      console.warn("[EMAIL EDGE FUNCTION] ⚠️ RESEND_API_KEY is not configured. Email not sent.");
      return { success: false, error: "RESEND_API_KEY not configured" };
    }
    const data = await resendClient.emails.send({`
);

fs.writeFileSync('emailService.ts', code);
console.log("Patched emailService.ts");
