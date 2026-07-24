const fs = require('fs');
let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8');

const formatPhoneFn = `
  const maskPhoneNumber = (phone: string) => {
    if (!phone) return "";
    let p = phone.trim().replace(/[\\s\\-()]/g, '');
    if (p.startsWith('0')) p = '+254' + p.substring(1);
    else if (!p.startsWith('+')) p = '+' + p;
    if (p.length < 12) return p; // not enough chars to mask
    return \`\${p.substring(0, 7)} *** \${p.substring(p.length - 3)}\`;
  };
`;

code = code.replace('export default function RegisterPage() {', 'export default function RegisterPage() {' + formatPhoneFn);

code = code.replace('setCountdown(119);', 'setCountdown(30);');
code = code.replace('setCountdown(119);', 'setCountdown(30);');

const oldStep3Title = /<h2 className="text-2xl font-bold text-\[\#1A1A1A\] mb-2">Verify Your Account<\/h2>\s*<p className="text-\[\#666\] text-center mb-8 max-w-sm">\s*We've sent a 6-digit verification code to <br\/>\s*<span className="font-bold text-\[\#1A1A1A\]">\{accountData\?.email\}<\/span>\s*<\/p>/;

const newStep3Title = `<h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Verify Your Phone Number</h2>
                <p className="text-[#666] text-center mb-8 max-w-sm">
                  We've sent a 6-digit verification code to <br/>
                  <span className="font-bold text-[#1A1A1A]">{maskPhoneNumber(accountData?.phone || '')}</span>
                </p>`;

code = code.replace(oldStep3Title, newStep3Title);

fs.writeFileSync('src/pages/RegisterPage.tsx', code);
