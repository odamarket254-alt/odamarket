const fs = require('fs');
let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8');

const effectCode = `
  useEffect(() => {
    if (step === 3 && otp.join("").length === 6 && !isLoading) {
      verifyOtp();
    }
  }, [otp, step]);

  const maskPhoneNumber = (phone: string) => {
`;

code = code.replace('  const maskPhoneNumber = (phone: string) => {', effectCode);

fs.writeFileSync('src/pages/RegisterPage.tsx', code);
