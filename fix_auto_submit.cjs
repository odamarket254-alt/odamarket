const fs = require('fs');
let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8');

// remove the effect
code = code.replace(/useEffect\(\(\) => \{\s*if \(step === 3 && otp.join\(""\)\.length === 6 && !isLoading\) \{\s*verifyOtp\(\);\s*\}\s*\}, \[otp, step\]\);/, '');

// update handleOtpChange and handleOtpPaste
const handleOtpChangeCode = `
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit
    if (newOtp.join("").length === 6) {
      setTimeout(() => {
        const btn = document.getElementById('verify-otp-btn');
        if (btn) btn.click();
      }, 50);
    }
  };
`;

const handleOtpPasteCode = `
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      if (!isNaN(Number(pastedData[i]))) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);
    
    if (pastedData.length < 6) {
      otpRefs.current[pastedData.length]?.focus();
    } else {
      otpRefs.current[5]?.focus();
      setTimeout(() => {
        const btn = document.getElementById('verify-otp-btn');
        if (btn) btn.click();
      }, 50);
    }
  };
`;

code = code.replace(/const handleOtpChange = [\s\S]*?const handleOtpKeyDown =/g, handleOtpChangeCode + '\n  const handleOtpKeyDown =');
code = code.replace(/const handleOtpPaste = [\s\S]*?const verifyOtp =/g, handleOtpPasteCode + '\n  const verifyOtp =');

// add id to verify button
code = code.replace(/<button\s+onClick=\{verifyOtp\}/, '<button id="verify-otp-btn" onClick={verifyOtp}');

fs.writeFileSync('src/pages/RegisterPage.tsx', code);
