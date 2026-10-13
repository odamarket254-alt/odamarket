import { resolveFirebaseServiceAccount, formatPemPrivateKey, getFlexibleEnvVar } from '../routes/fcmServerService.js';

console.log('--- Testing FCM Credentials Environment Resolution ---');

// Test 1: Test individual variables with requested snake_case names
process.env.project_id = 'test-oda-project';
process.env.private_key_id = 'key-id-12345';
process.env.private_key = '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgk...\\n-----END PRIVATE KEY-----\\n';
process.env.client_email = 'firebase-adminsdk-test@test-oda-project.iam.gserviceaccount.com';
process.env.client_id = 'client-id-67890';
process.env.auth_url = 'https://accounts.google.com/o/oauth2/auth';
process.env.authprovider_x509_cert_url = 'https://www.googleapis.com/oauth2/v1/certs';
process.env.client_x509_cert_url = 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-test%40test-oda-project.iam.gserviceaccount.com';
process.env.universe_domain = 'googleapis.com';

const res1 = resolveFirebaseServiceAccount();
console.log('Test 1 - Resolved Project ID:', res1.projectId);
console.log('Test 1 - Service Account Type:', res1.serviceAccount?.type);
console.log('Test 1 - Client Email:', res1.serviceAccount?.client_email);
console.log('Test 1 - Private Key has newlines:', res1.serviceAccount?.private_key?.includes('\n'));
console.log('Test 1 - Auth URI:', res1.serviceAccount?.auth_uri);
console.log('Test 1 - Universe Domain:', res1.serviceAccount?.universe_domain);

if (
  res1.projectId === 'test-oda-project' &&
  res1.serviceAccount?.type === 'service_account' &&
  res1.serviceAccount?.client_email === 'firebase-adminsdk-test@test-oda-project.iam.gserviceaccount.com' &&
  res1.serviceAccount?.private_key_id === 'key-id-12345' &&
  res1.serviceAccount?.client_id === 'client-id-67890' &&
  res1.serviceAccount?.universe_domain === 'googleapis.com'
) {
  console.log('✅ Test 1 PASSED: Successfully resolved all individual service account variables!');
} else {
  console.error('❌ Test 1 FAILED');
  process.exit(1);
}

// Clean up
delete process.env.project_id;
delete process.env.private_key_id;
delete process.env.private_key;
delete process.env.client_email;
delete process.env.client_id;
delete process.env.auth_url;
delete process.env.authprovider_x509_cert_url;
delete process.env.client_x509_cert_url;
delete process.env.universe_domain;

// Test 2: Test quoted private key with \n
const testKeyWithQuotes = '"-----BEGIN PRIVATE KEY-----\\nABCDEF\\n-----END PRIVATE KEY-----\\n"';
const formatted = formatPemPrivateKey(testKeyWithQuotes);
if (formatted && formatted.startsWith('-----BEGIN') && formatted.includes('\nABCDEF\n')) {
  console.log('✅ Test 2 PASSED: Quotes stripped and newlines normalized correctly!');
} else {
  console.error('❌ Test 2 FAILED:', formatted);
  process.exit(1);
}

console.log('All FCM Credential tests completed successfully.');
