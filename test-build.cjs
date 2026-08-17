const { build } = require('vite');
async function run() {
  process.env.SUPABASE_ANON_KEY = 'TEST_ANON_KEY_FROM_VITE_CONFIG';
  delete process.env.VITE_SUPABASE_ANON_KEY;
  await build();
}
run();
