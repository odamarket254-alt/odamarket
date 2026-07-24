const fs = require('fs');
let code = fs.readFileSync('src/components/CheckoutAuthModal.tsx', 'utf8');

const handleSignupStart = code.indexOf('const handleSignup = async (e: React.FormEvent) => {');
const verifyOtpStart = code.indexOf('const verifyOtp = async () => {');

if (handleSignupStart > -1 && verifyOtpStart > -1) {
  const newMiddle = `
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!signupData.agreed) {
      setError("Please agree to the Terms & Conditions");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      
      let formattedPhone = signupData.phone.trim().replace(/[\\s\\-()]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }
      
      // Check if user exists
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupData.email, phone: formattedPhone }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error || "Failed to verify details");

      setSignupData({ ...signupData, phone: formattedPhone });

      // Call our Africa's Talking backend endpoint
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to send OTP');
      }

      setView("otp");
      setCountdown(30);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  `;
  code = code.substring(0, handleSignupStart) + newMiddle + code.substring(verifyOtpStart);
}

const resendStart = code.indexOf('const handleResendOtp = async () => {');
if (resendStart > -1) {
  code = code.replace(/setCountdown\(119\);/g, 'setCountdown(30);');
}

const verifyOtpOld = /const verifyOtp = async \(\) => \{[\s\S]*?\} catch \(err: any\) \{[\s\S]*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};/;
const newVerifyOtp = `
  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Verify OTP via our custom endpoint
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: signupData.phone, 
          otp: code,
          accountData: {
            email: signupData.email,
            password: signupData.password,
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            phone: signupData.phone,
          }
        }),
      });
      const resData = await response.json();
      
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to verify OTP');
      }

      if (resData.userId) {
        setUserId(resData.userId);
      }

      // Auto login
      await supabase.auth.signInWithPassword({
        email: signupData.email,
        password: signupData.password
      });

      setView("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP");
    } finally {
      setIsLoading(false);
    }
  };
`;

code = code.replace(verifyOtpOld, newVerifyOtp.trim());

fs.writeFileSync('src/components/CheckoutAuthModal.tsx', code);
