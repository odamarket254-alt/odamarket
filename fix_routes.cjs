const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add imports
content = content.replace(
  'const WishlistPage = lazy(() => import("./pages/WishlistPage"));',
  `const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const TrackOrderPage = lazy(() => import("./pages/TrackOrderPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const StoreLocatorPage = lazy(() => import("./pages/StoreLocatorPage"));`
);

// Add routes inside <Route element={<RootLayout />}> 
// Let's find <Route path="/contact" element={<ContactPage />} /> and put them next to it
content = content.replace(
  '<Route path="/contact" element={<ContactPage />} />',
  `<Route path="/contact" element={<ContactPage />} />
              <Route path="/track-order" element={<TrackOrderPage />} />
              <Route path="/help-center" element={<HelpCenterPage />} />
              <Route path="/store-locator" element={<StoreLocatorPage />} />`
);

fs.writeFileSync('src/App.tsx', content);
