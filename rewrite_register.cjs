const fs = require('fs');
let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8');

const onAddressSubmitStart = code.indexOf('const onAddressSubmit = async (data: AddressFormValues) => {');
const resendOtpStart = code.indexOf('const resendOtp = async () => {');

if (onAddressSubmitStart > -1 && resendOtpStart > -1) {
  const newMiddle = `
  const onAddressSubmit = async (data: AddressFormValues) => {
    setAddressData(data);
    setIsLoading(true);
    try {
      if (!accountData) return;
      
      let formattedPhone = accountData.phone.trim().replace(/[\\s\\-()]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      // Check if user exists
      const checkRes = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountData.email, phone: formattedPhone }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error || "Failed to verify details");

      // Send OTP
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.error || "Failed to send OTP");

      toast.success("Verification code sent via SMS!");
      setCountdown(30);
      setStep(3);
    } catch (error: any) {
      toast.error(error.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  `;
  code = code.substring(0, onAddressSubmitStart) + newMiddle + code.substring(resendOtpStart);
}

const verifyOtpStart = code.indexOf('const verifyOtp = async () => {');
const afterVerifyOtp = code.indexOf('return (', verifyOtpStart);

if (verifyOtpStart > -1 && afterVerifyOtp > -1) {
  const newVerify = `const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setIsLoading(true);
    try {
      if (!accountData) return;

      let formattedPhone = accountData.phone.trim().replace(/[\\s\\-()]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          otp: code,
          accountData: accountData
        })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Invalid verification code.");

      // Sign in automatically
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: accountData.email,
        password: accountData.password,
      });

      if (signInError) throw signInError;

      if (signInData.user && addressData) {
        // Create address
        await supabase.from("delivery_addresses").insert({
          user_id: signInData.user.id,
          full_name: \`\${accountData.first_name} \${accountData.last_name}\`,
          phone_number: accountData.phone,
          street_address: addressData.street_address,
          apartment_suite: addressData.apartment_suite,
          city: addressData.city,
          county: addressData.county,
          postal_code: addressData.postal_code,
          is_default: true,
        });
      }

      setStep(4);
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  `;
  code = code.substring(0, verifyOtpStart) + newVerify + code.substring(afterVerifyOtp);
}

fs.writeFileSync('src/pages/RegisterPage.tsx', code);
