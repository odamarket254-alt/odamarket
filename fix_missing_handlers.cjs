const fs = require('fs');
let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8');

const missingHandlers = `
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

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

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

code = code.replace('return (', missingHandlers + '\\n  return (');

// also fix the verifyOtp button id
code = code.replace(/<button\\s+onClick=\\{verifyOtp\\}/, '<button id="verify-otp-btn" onClick={verifyOtp}');

fs.writeFileSync('src/pages/RegisterPage.tsx', code);
