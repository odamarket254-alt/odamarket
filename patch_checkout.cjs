const fs = require('fs');
let code = fs.readFileSync('src/pages/CheckoutPage.tsx', 'utf8');

code = code.replace(
  /setShippingDetails\(\{\n\s*recipientName: data.full_name,\n\s*recipientPhone: data.phone,\n\s*county: data.county,\n\s*townCity: data.town_city,\n\s*areaLocation: data.area_location \|\| "",\n\s*streetBuilding: data.street_building,\n\s*deliveryInstructions: data.delivery_instructions \|\| ""\n\s*\}\);/g,
  `setShippingDetails({
            recipientName: data.full_name,
            recipientPhone: data.phone,
            location: (data.county || "") + ", " + (data.town_city || ""),
            fullAddress: (data.area_location || "") + ", " + (data.street_building || "")
          });`
);

fs.writeFileSync('src/pages/CheckoutPage.tsx', code);
