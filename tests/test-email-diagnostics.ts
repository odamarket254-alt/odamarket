import assert from 'assert';
import { getEmailDiagnostics, logEmailDiagnostics } from '../src/lib/emailDiagnostics.js';

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING EMAIL DIAGNOSTICS & VERIFICATION TESTS');
  console.log('====================================================\n');

  // Test 1: getEmailDiagnostics without live check
  const basicReport = await getEmailDiagnostics(false);
  console.log('Basic Report:', JSON.stringify(basicReport, null, 2));

  assert(basicReport.timestamp, 'TEST 1: Report contains timestamp');
  assert(basicReport.environment, 'TEST 1: Report contains environment object');
  assert(typeof basicReport.environment.isProduction === 'boolean', 'TEST 1: isProduction is boolean');
  assert(basicReport.resend, 'TEST 1: Report contains resend object');
  assert(typeof basicReport.resend.apiKeyConfigured === 'boolean', 'TEST 1: apiKeyConfigured is boolean');
  assert(typeof basicReport.resend.apiKeyLength === 'number', 'TEST 1: apiKeyLength is number');
  assert(typeof basicReport.resend.fromEmailResolved === 'string', 'TEST 1: fromEmailResolved is string');
  assert(!basicReport.connectionTest, 'TEST 1: connectionTest is absent when performLiveCheck is false');
  console.log('✅ PASS: TEST 1: Basic diagnostics generated correctly');

  // Test 2: Security check - No raw API key exposed in report
  const rawKey = (process.env.RESEND_API_KEY || '').trim();
  const serialized = JSON.stringify(basicReport);
  if (rawKey.length > 5) {
    assert(!serialized.includes(rawKey), 'TEST 2: Security check: raw RESEND_API_KEY is NEVER exposed in serialized diagnostics');
  }
  console.log('✅ PASS: TEST 2: Security check passed (no credentials exposed)');

  // Test 3: getEmailDiagnostics with live connection check
  const liveReport = await getEmailDiagnostics(true);
  console.log('Live Report:', JSON.stringify(liveReport, null, 2));
  assert(liveReport.connectionTest, 'TEST 3: connectionTest is present when live check is requested');
  assert(
    liveReport.connectionTest.status === 'success' || liveReport.connectionTest.status === 'not_configured',
    `TEST 3: Live connection status is valid (${liveReport.connectionTest.status})`
  );
  if (liveReport.connectionTest.status === 'success') {
    assert(Array.isArray(liveReport.connectionTest.verifiedDomains), 'TEST 3: verifiedDomains is array');
    console.log(`Verified domains discovered: ${liveReport.connectionTest.verifiedDomains.join(', ')}`);
  }
  console.log('✅ PASS: TEST 3: Live Resend connection check completed successfully');

  // Test 4: logEmailDiagnostics function executes without throwing
  let logThrown = false;
  try {
    logEmailDiagnostics('Unit Test');
  } catch (err) {
    logThrown = true;
  }
  assert(!logThrown, 'TEST 4: logEmailDiagnostics runs without throwing');
  console.log('✅ PASS: TEST 4: logEmailDiagnostics executes cleanly');

  console.log('\n====================================================');
  console.log('ALL EMAIL DIAGNOSTICS TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
