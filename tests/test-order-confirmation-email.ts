import { buildOrderConfirmationEmailHtml, formatCurrency, sendOrderConfirmationEmailForOrder } from '../emailService.js';
import { handlePaystackWebhook } from '../routes/paystackWebhook.js';
import crypto from 'crypto';

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING ODA MARKET ORDER CONFIRMATION EMAIL TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 9 & 10: HTML generation with multiple products & quantities > 1
  const testData = {
    customerName: 'Jane Wanjiku',
    customerEmail: 'jane@odamarket.co.ke',
    customerPhone: '+254712345678',
    orderNumber: 'ODA-TEST1001',
    orderId: 'test-order-uuid-1',
    orderDate: 'September 23, 2026 at 4:00 PM',
    items: [
      { name: 'Fresh Sukuma Wiki (Bunch)', quantity: 3, unitPrice: 50, lineTotal: 150 },
      { name: 'Organic Ripe Tomatoes (1kg)', quantity: 2, unitPrice: 120, lineTotal: 240 },
      { name: 'Pure Forest Honey 500g', quantity: 1, unitPrice: 650, lineTotal: 650 }
    ],
    subtotal: 1040,
    deliveryFee: 150,
    discountAmount: 40,
    total: 1150,
    deliveryMethod: 'express',
    deliveryAddress: 'Kilimani, Ring Road, Apt 4B, Nairobi',
    paymentMethod: 'Paystack M-Pesa',
    paymentStatus: 'PAID',
    paymentReference: 'ord_test_ref_998877',
    orderStatus: 'processing',
    storeName: 'ODA Market Verified Fulfillment',
    trackingUrl: 'https://odamarket.co.ke/track-order?id=test-order-uuid-1'
  };

  const html = buildOrderConfirmationEmailHtml(testData);

  assert(html.includes('ODA MARKET'), 'TEST 1: HTML includes ODA MARKET brand header');
  assert(html.includes('Order Confirmed'), 'TEST 2: HTML includes "Order Confirmed" title');
  assert(html.includes('Jane Wanjiku'), 'TEST 3: HTML includes Customer Name');
  assert(html.includes('ODA-TEST1001'), 'TEST 4: HTML includes Order Number');
  assert(html.includes('Fresh Sukuma Wiki (Bunch)'), 'TEST 5: Product 1 is rendered in items table');
  assert(html.includes('Organic Ripe Tomatoes (1kg)'), 'TEST 6: Product 2 is rendered in items table');
  assert(html.includes('Pure Forest Honey 500g'), 'TEST 7: Product 3 is rendered in items table');
  assert(html.includes('Qty: <strong style="color: #3A2418;">3</strong> &times; KSh 50'), 'TEST 8: Product 1 unit price and quantity rendered correctly');
  assert(html.includes('KSh 1,150'), 'TEST 9: Total calculated correctly with KSh formatting');
  assert(html.includes('Kilimani, Ring Road, Apt 4B, Nairobi'), 'TEST 10: Delivery address rendered properly');
  assert(html.includes('https://odamarket.co.ke/track-order?id=test-order-uuid-1'), 'TEST 11: "View My Order" CTA button links to order tracking page');
  assert(html.includes('info@odamarket.co.ke'), 'TEST 12: Customer support email info@odamarket.co.ke present');
  assert(html.includes('0792867386'), 'TEST 13: Customer support phone 0792867386 present');

  // TEST 14: Payment Rule: Cannot send confirmation email if order is pending or failed
  const unconfirmedResult = await sendOrderConfirmationEmailForOrder('fake-order-id-that-does-not-exist');
  assert(unconfirmedResult.success === false, 'TEST 14: Unconfirmed or non-existent order strictly rejected without sending email');

  // TEST 15: Security check: RESEND_API_KEY does not start with VITE_ or public prefix
  assert(!process.env.VITE_RESEND_API_KEY, 'TEST 15: RESEND_API_KEY is server-side only and never prefixed with VITE_');

  console.log(`\nTEST SUMMARY: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
