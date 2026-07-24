const fs = require('fs');
let code = fs.readFileSync('src/pages/RegisterPage.tsx', 'utf8');

code = code.replace(
  'street_address: addressData.street_address,',
  'street_address: addressData.street || addressData.formatted_address || "",'
);
code = code.replace(
  'apartment_suite: addressData.apartment_suite,',
  'apartment_suite: addressData.apartment || addressData.house_number || "",'
);
code = code.replace(
  'city: addressData.city,',
  'city: addressData.town || "",'
);
code = code.replace(
  'postal_code: addressData.postal_code,',
  'postal_code: "",'
);

fs.writeFileSync('src/pages/RegisterPage.tsx', code);
