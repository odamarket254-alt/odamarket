const fs = require('fs');
let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8');

const newResendOtp = `
  const resendOtp = async () => {
    if (!accountData || countdown > 0) return;
    setIsLoading(true);
    try {
      let formattedPhone = accountData.phone.trim().replace(/[\\s\\-()]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.error || "Failed to send OTP");

      toast.success("A new verification code has been sent!");
      setCountdown(30);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error(error.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };
`;

code = code.replace(
  /const resendOtp = async \(\) => \{[\s\S]*?\} catch \(error: any\) \{[\s\S]*?toast\.error\(error\.message \|\| "Failed to resend code\."\);\s*\}\s*\};/,
  newResendOtp.trim()
);

fs.writeFileSync('src/pages/RegisterPage.tsx', code);
