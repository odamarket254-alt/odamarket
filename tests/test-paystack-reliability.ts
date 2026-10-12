import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { processAuthoritativePaymentVerification } from '../routes/paymentVerificationService.js';
import { handlePaystackWebhook } from '../routes/paystackWebhook.js';

const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^["']|["']$/g, '');
const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
const paystackSecret = (process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_secret_key_12345').trim().replace(/^["']|["']$/g, '');

const adminSupabase = createClient(supabaseUrl, supabaseKey);
const anonSupabase = createClient(supabaseUrl, anonKey);

async function runAllTests() {
  console.log('\n======================================================');
  console.log('RUNNING COMPREHENSIVE PAYSTACK PAYMENT RELIABILITY TESTS');
  console.log('======================================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      testsPassed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, details || '');
      testsFailed++;
    }
  }

  // Set up mock product and buyer
  const testEmailBuyer1 = `buyer1_${Date.now()}@testoda.com`;
  const testEmailBuyer2 = `buyer2_${Date.now()}@testoda.com`;

  const { data: userAuth1 } = await adminSupabase.auth.admin.createUser({
    email: testEmailBuyer1,
    password: 'Password123!',
    email_confirm: true
  });
  const { data: userAuth2 } = await adminSupabase.auth.admin.createUser({
    email: testEmailBuyer2,
    password: 'Password123!',
    email_confirm: true
  });

  const buyer1Id = userAuth1!.user.id;
  const buyer2Id = userAuth2!.user.id;

  // Fetch or create a test product with known stock
  const { data: testProduct } = await adminSupabase
    .from('products')
    .select('id, name, stock, price')
    .gt('stock', 10)
    .limit(1)
    .single();

  const initialStock = testProduct?.stock || 50;
  const productId = testProduct?.id;

  console.log(`Using Test Product: ${testProduct?.name || 'Item'} (ID: ${productId}, Initial Stock: ${initialStock})`);

  // Helper to create an order
  async function createTestOrder(userId: string, total: number = 250): Promise<string> {
    const { data: o, error } = await adminSupabase.from('orders').insert({
      user_id: userId,
      order_number: 'TEST-' + crypto.randomBytes(3).toString('hex').toUpperCase(),
      status: 'pending',
      payment_status: 'pending',
      subtotal: total,
      delivery_fee: 0,
      total: total,
      notes: JSON.stringify({ contactDetails: { userEmail: testEmailBuyer1 } })
    }).select().single();

    if (error || !o) throw new Error('Order creation failed: ' + error?.message);

    if (productId) {
      await adminSupabase.from('order_items').insert({
        order_id: o.id,
        product_id: productId,
        product_name: testProduct?.name || 'Product',
        quantity: 2,
        unit_price: total / 2,
        total_price: total
      });
    }

    return o.id;
  }

  // Mock global fetch for Paystack verification API tests
  const originalFetch = global.fetch;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Successful Payment Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1: Successful Payment Verification ---');
    const orderId1 = await createTestOrder(buyer1Id, 500);
    const validRef1 = `ord_${orderId1}_987654321`;

    // Mock Paystack returning successful 500 KES transaction
    global.fetch = async (url: any, opts: any): Promise<any> => {
      if (typeof url === 'string' && url.includes('api.paystack.co/transaction/verify')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: true,
            message: 'Verification successful',
            data: {
              status: 'success',
              reference: validRef1,
              amount: 50000, // 500 KES in kobo
              currency: 'KES',
              gateway_response: 'Successful'
            }
          })
        };
      }
      return originalFetch(url, opts);
    };

    const result1 = await processAuthoritativePaymentVerification({
      orderId: orderId1,
      reference: validRef1,
      source: 'inline_checkout',
      authenticatedUserId: buyer1Id
    });

    const { data: dbOrder1 } = await adminSupabase.from('orders').select('*').eq('id', orderId1).single();

    assert(result1.success === true && result1.status === 'paid', 'Verification returns success = true and status = paid');
    assert(dbOrder1.payment_status === 'success', 'Order payment_status is authoritatively set to success');
    assert(dbOrder1.status === 'processing', 'Order status moved from pending to processing');
    assert(dbOrder1.payment_reference === validRef1, 'Order payment_reference recorded correctly');

    // -------------------------------------------------------------------------
    // TEST 2: Failed Payment Handling
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Failed Payment Handling ---');
    const orderId2 = await createTestOrder(buyer1Id, 300);
    const failRef = `ord_${orderId2}_fail_12345`;

    global.fetch = async (url: any, opts: any): Promise<any> => {
      if (typeof url === 'string' && url.includes('api.paystack.co/transaction/verify')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: true,
            data: {
              status: 'failed',
              reference: failRef,
              amount: 30000,
              currency: 'KES',
              gateway_response: 'Insufficient Funds'
            }
          })
        };
      }
      return originalFetch(url, opts);
    };

    const result2 = await processAuthoritativePaymentVerification({
      orderId: orderId2,
      reference: failRef,
      source: 'inline_checkout',
      authenticatedUserId: buyer1Id
    });

    const { data: dbOrder2 } = await adminSupabase.from('orders').select('*').eq('id', orderId2).single();

    assert(result2.success === false && result2.status === 'failed', 'Verification returns success = false for failed payment');
    assert(dbOrder2.payment_status === 'failed', 'Order payment_status updated to failed in database');
    assert(dbOrder2.status === 'pending', 'Order status remains pending (not marked processing/shipped)');

    // -------------------------------------------------------------------------
    // TEST 3: Cancelled / Missing Reference (Checkout Closed)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Cancelled / Missing Reference Checkout ---');
    const orderId3 = await createTestOrder(buyer1Id, 450);

    const result3 = await processAuthoritativePaymentVerification({
      orderId: orderId3,
      reference: '', // Missing / user closed modal
      source: 'inline_checkout',
      authenticatedUserId: buyer1Id
    });

    const { data: dbOrder3 } = await adminSupabase.from('orders').select('*').eq('id', orderId3).single();

    assert(result3.success === false && result3.status === 'abandoned', 'Returns abandoned status for missing reference');
    assert(dbOrder3.payment_status === 'abandoned', 'Order payment_status set to abandoned');
    assert(dbOrder3.status === 'pending', 'Valid order is preserved in database (not deleted)');

    // -------------------------------------------------------------------------
    // TEST 4: Incorrect Amount / Currency Mismatch
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Amount & Currency Mismatch Rejection ---');
    const orderId4 = await createTestOrder(buyer1Id, 1000); // 1000 KES expected
    const tamperRef = `ord_${orderId4}_tamper_999`;

    // Simulated Paystack returning payment for only 100 KES (tampered or partial)
    global.fetch = async (url: any, opts: any): Promise<any> => {
      if (typeof url === 'string' && url.includes('api.paystack.co/transaction/verify')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: true,
            data: {
              status: 'success',
              reference: tamperRef,
              amount: 10000, // Only 100 KES instead of 1000 KES
              currency: 'KES',
              gateway_response: 'Successful'
            }
          })
        };
      }
      return originalFetch(url, opts);
    };

    const result4 = await processAuthoritativePaymentVerification({
      orderId: orderId4,
      reference: tamperRef,
      source: 'inline_checkout',
      authenticatedUserId: buyer1Id
    });

    const { data: dbOrder4 } = await adminSupabase.from('orders').select('*').eq('id', orderId4).single();

    assert(result4.success === false, 'Verification rejected on amount mismatch');
    assert(dbOrder4.payment_status === 'failed', 'Tampered amount order marked as payment_status failed');

    // -------------------------------------------------------------------------
    // TEST 5: Invalid / Foreign Reference Association
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Reference Not Associated with Order ---');
    const orderId5 = await createTestOrder(buyer1Id, 200);
    const foreignRef = `ord_DIFFERENT_ORDER_ID_112233`;

    const result5 = await processAuthoritativePaymentVerification({
      orderId: orderId5,
      reference: foreignRef,
      source: 'inline_checkout',
      authenticatedUserId: buyer1Id
    });

    assert(result5.success === false, 'Rejects payment reference belonging to a different order');
    assert(result5.message.includes('not associated'), 'Error message identifies order mismatch');

    // -------------------------------------------------------------------------
    // TEST 6: Forged Webhook Rejection (Invalid HMAC SHA512 Signature)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Forged Webhook Signature Rejection ---');
    const forgedPayload = JSON.stringify({
      event: 'charge.success',
      data: { reference: `ord_${orderId1}_123`, amount: 50000, currency: 'KES' }
    });

    let webhookStatus = 0;
    const mockRes = {
      status: (code: number) => { webhookStatus = code; return mockRes; },
      send: (msg: string) => mockRes
    };

    // Subtest 6A: Missing signature header
    const mockReqMissingSig: any = {
      headers: {},
      body: Buffer.from(forgedPayload, 'utf8'),
      ip: '127.0.0.1'
    };
    await handlePaystackWebhook(mockReqMissingSig, mockRes as any);
    assert(webhookStatus === 401, 'Webhook with missing signature header returns 401 Unauthorized');

    // Subtest 6B: Tampered / forged signature
    webhookStatus = 0;
    const mockReqInvalidSig: any = {
      headers: { 'x-paystack-signature': 'forged_fake_signature_abc123' },
      body: Buffer.from(forgedPayload, 'utf8'),
      ip: '127.0.0.1'
    };
    await handlePaystackWebhook(mockReqInvalidSig, mockRes as any);
    assert(webhookStatus === 401, 'Webhook with forged invalid signature returns 401 Unauthorized');

    // -------------------------------------------------------------------------
    // TEST 7 & 8: Duplicate Webhooks & Concurrent Verification Mutex
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7 & 8: Duplicate Webhooks and Concurrent Mutex ---');
    const orderId7 = await createTestOrder(buyer1Id, 400);
    const validRef7 = `ord_${orderId7}_race_777`;

    global.fetch = async (url: any, opts: any): Promise<any> => {
      if (typeof url === 'string' && url.includes('api.paystack.co/transaction/verify')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: true,
            data: {
              status: 'success',
              reference: validRef7,
              amount: 40000,
              currency: 'KES',
              gateway_response: 'Successful'
            }
          })
        };
      }
      return originalFetch(url, opts);
    };

    // Fire 3 simultaneous verification calls (e.g. user double-clicked AND webhook arrived at same millisecond)
    const [callA, callB, callC] = await Promise.all([
      processAuthoritativePaymentVerification({ orderId: orderId7, reference: validRef7, source: 'inline_checkout', authenticatedUserId: buyer1Id }),
      processAuthoritativePaymentVerification({ orderId: orderId7, reference: validRef7, source: 'webhook' }),
      processAuthoritativePaymentVerification({ orderId: orderId7, reference: validRef7, source: 'inline_checkout', authenticatedUserId: buyer1Id })
    ]);

    assert(callA.success === true && callB.success === true && callC.success === true, 'All concurrent calls resolve safely with success');
    const { data: dbOrder7 } = await adminSupabase.from('orders').select('*').eq('id', orderId7).single();
    assert(dbOrder7.payment_status === 'success', 'Order has payment_status = success');

    // Repeated call after already verified:
    const subsequentCall = await processAuthoritativePaymentVerification({
      orderId: orderId7,
      reference: validRef7,
      source: 'webhook'
    });
    assert(subsequentCall.isDuplicateOrAlreadyProcessed === true, 'Subsequent duplicate verification detected and handled idempotently');

    // -------------------------------------------------------------------------
    // TEST 9: Unauthorized Status Change & Ownership Protection
    // -------------------------------------------------------------------------
    console.log('\n--- Test 9: Unauthorized Status Change & Ownership Protection ---');
    const orderId9 = await createTestOrder(buyer1Id, 350); // Owned by Buyer 1
    const validRef9 = `ord_${orderId9}_auth_999`;

    // Buyer 2 attempts to verify Buyer 1's order
    const unauthorizedResult = await processAuthoritativePaymentVerification({
      orderId: orderId9,
      reference: validRef9,
      source: 'inline_checkout',
      authenticatedUserId: buyer2Id, // DIFFERENT USER
      isAdmin: false
    });

    assert(unauthorizedResult.success === false, 'Blocked unauthorized user from verifying another buyer order');
    assert(unauthorizedResult.message.includes('Unauthorized'), 'Returns explicit unauthorized ownership message');

    // Direct database update attempt via anonymous/client RLS
    const { data: clientUpdate } = await anonSupabase
      .from('orders')
      .update({ payment_status: 'success', status: 'delivered' })
      .eq('id', orderId9)
      .select();

    assert(Array.isArray(clientUpdate) && clientUpdate.length === 0, 'Client RLS completely blocks direct payment status tampering');

    // -------------------------------------------------------------------------
    // TEST 10: Temporary Paystack Outage / Retryable Pending State
    // -------------------------------------------------------------------------
    console.log('\n--- Test 10: Temporary Paystack Outage (Safe Pending Retry) ---');
    const orderId10 = await createTestOrder(buyer1Id, 150);
    const retryRef = `ord_${orderId10}_temp_503`;

    // Paystack returns 503 Service Unavailable
    global.fetch = async (url: any, opts: any): Promise<any> => {
      if (typeof url === 'string' && url.includes('api.paystack.co/transaction/verify')) {
        return {
          ok: false,
          status: 503,
          json: async () => ({ status: false, message: 'Paystack gateway temporarily down' })
        };
      }
      return originalFetch(url, opts);
    };

    const outageResult = await processAuthoritativePaymentVerification({
      orderId: orderId10,
      reference: retryRef,
      source: 'inline_checkout',
      authenticatedUserId: buyer1Id
    });

    const { data: dbOrder10 } = await adminSupabase.from('orders').select('*').eq('id', orderId10).single();

    assert(outageResult.retryable === true, 'Outage returns retryable = true');
    assert(outageResult.status === 'pending', 'Order left in pending state instead of failing/marking paid');
    assert(dbOrder10.payment_status === 'pending', 'Database order payment_status safely remains pending');

  } finally {
    // Restore original fetch
    global.fetch = originalFetch;

    // Cleanup test users
    try {
      await adminSupabase.auth.admin.deleteUser(buyer1Id);
      await adminSupabase.auth.admin.deleteUser(buyer2Id);
    } catch (e) {}
  }

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
