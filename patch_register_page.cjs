const fs = require('fs');

let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8');

// 1. Replace onAccountSubmit
const accountSubmitRegex = /const onAccountSubmit = async \(data: AccountFormValues\) => \{[\s\S]*?setStep\(2\); \/\/ Move to Verification step\s*\} catch \(error: any\) \{[\s\S]*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};/;
const newAccountSubmit = `const onAccountSubmit = async (data: AccountFormValues) => {
    setAccountData(data);
    setStep(3); // Skip OTP, go straight to Address
  };`;
code = code.replace(accountSubmitRegex, newAccountSubmit);

// 2. Replace onAddressSubmit
const addressSubmitRegex = /const onAddressSubmit = async \(data: AddressFormValues\) => \{[\s\S]*?setStep\(4\);\s*\} catch \(error: any\) \{[\s\S]*?finally \{\s*setIsLoading\(false\);\s*\}\s*\};/;
const newAddressSubmit = `const onAddressSubmit = async (data: AddressFormValues) => {
    setAddressData(data);
    if (!accountData) {
      setStep(1);
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountData, addressData: data })
      });
      let resData;
      try {
        resData = await res.json();
      } catch (e) {
        throw new Error("Server returned an invalid response. Please try again.");
      }
      if (!res.ok) throw new Error(resData?.error || "Failed to create account.");
      
      setCreatedUserId(resData.userId);
      setStep(4);
    } catch (error: any) {
      toast.error(error.message || "Failed to register.");
    } finally {
      setIsLoading(false);
    }
  };`;
code = code.replace(addressSubmitRegex, newAddressSubmit);

// 3. Update Step 4 UI
code = code.replace(
  /<p className="text-\[#666\] text-center mb-8 max-w-sm text-lg">\s*Your account has been created successfully.\s*<\/p>/,
  `<p className="text-[#666] text-center mb-8 max-w-sm text-lg">
                  Your account has been created successfully. <br/><br/>
                  <span className="font-bold text-[#1A1A1A]">Please check your email to confirm your account.</span>
                </p>`
);

code = code.replace(
  /<Link\s*to="\/dashboard"\s*className="w-full max-w-sm h-\[52px\] rounded-xl bg-\[#D96A27\] hover:bg-\[#c45a1f\] text-white font-bold text-\[16px\] shadow-\[0_4px_14px_rgba\(217,106,39,0\.3\)\] hover:shadow-\[0_6px_20px_rgba\(217,106,39,0\.4\)\] transition-all duration-300 flex items-center justify-center gap-2"\s*>\s*Start Shopping <ArrowRight className="w-5 h-5 ml-1" \/>\s*<\/Link>/,
  `<Link
                  to="/login"
                  className="w-full max-w-sm h-[52px] rounded-xl bg-[#D96A27] hover:bg-[#c45a1f] text-white font-bold text-[16px] shadow-[0_4px_14px_rgba(217,106,39,0.3)] hover:shadow-[0_6px_20px_rgba(217,106,39,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Go to Login <ArrowRight className="w-5 h-5 ml-1" />
                </Link>`
);

// 4. Also fix the step progress bar numbers
// Since we skip step 2, maybe we rename the steps, but changing logic is easier if we just leave it or hide step 2.
// Let's hide the OTP step from the UI Progress bar or adjust the progress bar logic
code = code.replace(
  /const steps = \[[\s\S]*?\];/,
  `const steps = [
    { number: 1, title: "Account Info" },
    { number: 3, title: "Delivery Address" },
    { number: 4, title: "Complete" },
  ];`
);

fs.writeFileSync('src/pages/RegisterPage.tsx', code);
console.log('Success');
