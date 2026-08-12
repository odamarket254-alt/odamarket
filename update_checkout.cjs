const fs = require('fs');

let content = fs.readFileSync('src/pages/CheckoutPage.tsx', 'utf8');

// We need to add state for confirmedOrder
if (!content.includes('const [confirmedOrder, setConfirmedOrder]')) {
  content = content.replace(
    'const [isSuccess, setIsSuccess] = useState(false);',
    'const [isSuccess, setIsSuccess] = useState(false);\n  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);\n  const [receiptError, setReceiptError] = useState<string | null>(null);'
  );
}

// Replace handlePlaceOrder's setTimeout
const oldTimeout = `      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
        clearCart();
      }, 1500);`;

const newVerify = `      // Simulate M-Pesa delay
      setTimeout(async () => {
        try {
          const verifyResponse = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderId })
          });
          const verifyData = await verifyResponse.json();
          if (verifyResponse.ok) {
            setConfirmedOrder(verifyData);
          } else {
            setReceiptError("Your payment was successful, but we couldn't generate the receipt. Please try again.");
          }
        } catch (e) {
          console.error(e);
          setReceiptError("Your payment was successful, but we couldn't generate the receipt. Please try again.");
        }
        setIsProcessing(false);
        setIsSuccess(true);
        clearCart();
      }, 2000);`;

content = content.replace(oldTimeout, newVerify);

fs.writeFileSync('src/pages/CheckoutPage.tsx', content);
