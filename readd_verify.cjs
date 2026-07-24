const fs = require('fs');
let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8');

const verifyCode = `
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

code = code.replace('  const handleOtpChange =', verifyCode + '\\n  const handleOtpChange =');
fs.writeFileSync('src/pages/RegisterPage.tsx', code);
