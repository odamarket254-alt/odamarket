(globalThis as any).import = { meta: { env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' } } };
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import CartPage from './src/pages/CartPage';

try {
  console.log("Rendering...");
  const html = renderToString(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  );
  console.log("Rendered successfully!", html.slice(0, 100));
} catch (err) {
  console.error("Error during render:", err);
}
