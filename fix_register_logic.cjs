const fs = require('fs');
let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8');

// Replace onAddressSubmit
const newOnAddressSubmit = `
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
      setCountdown(119);
      setStep(3);
    } catch (error: any) {
      toast.error(error.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };
`;

code = code.replace(
  /const onAddressSubmit = async \([^)]+\) => \{[\s\S]*?setStep\(3\);\s*\} catch \(error: any\) \{[\s\S]*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};/,
  newOnAddressSubmit.trim()
);

// Replace verifyOtp
const newVerifyOtp = `
  const verifyOtp = async () => {
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

code = code.replace(
  /const verifyOtp = async \(\) => \{[\s\S]*?setStep\(4\);\s*\} catch \(error: any\) \{[\s\S]*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};/,
  newVerifyOtp.trim()
);

// Replace resendOtp
const newResendOtp = `
  const handleResendOtp = async () => {
    if (!accountData) return;
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
      setCountdown(119);
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
  /const handleResendOtp = async \(\) => \{[\s\S]*?toast\.success\("A new verification code has been sent!"\);[\s\S]*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};/,
  newResendOtp.trim()
);

fs.writeFileSync('src/pages/RegisterPage.tsx', code);
