const fs = require('fs');
let code = fs.readFileSync('routes/authRoutes.ts', 'utf8');

// Replace the console.warn with a more graceful fallback handling
code = code.replace(
  "console.warn('Supabase Error saving OTP:', dbError.message);",
  "// Silently fallback to memory if table doesn't exist\\n      if (!dbError.message.includes('Could not find the table')) {\\n        console.warn('Supabase Error saving OTP:', dbError.message);\\n      }"
);

fs.writeFileSync('routes/authRoutes.ts', code);
