const fs = require('fs');
let content = fs.readFileSync('src/pages/CheckoutPage.tsx', 'utf8');

// Replace import
content = content.replace(
  /import html2canvas from "html2canvas";/,
  'import { toPng, toBlob } from "html-to-image";'
);

// Replace handleDownloadReceipt
content = content.replace(
  /const canvas = await html2canvas\(el, \{ scale: 2, useCORS: true \}\);\s*const url = canvas\.toDataURL\('image\/png'\);/,
  'const url = await toPng(el, { pixelRatio: 2 });'
);

// Replace handleShareReceipt
content = content.replace(
  /const canvas = await html2canvas\(el, \{ scale: 2, useCORS: true \}\);\s*canvas\.toBlob\(async \(blob\) => \{/,
  'const blob = await toBlob(el, { pixelRatio: 2 });\n      if (blob) (async (blob) => {'
);
content = content.replace(
  /toast\.error\("Native sharing not supported on this device\. Please download instead\."\);\s*\}\s*\}\);/,
  'toast.error("Native sharing not supported on this device. Please download instead.");\n        }\n      })(blob);'
);

// Replace handleWhatsAppImage
content = content.replace(
  /const canvas = await html2canvas\(el, \{ scale: 2, useCORS: true \}\);\s*const url = canvas\.toDataURL\('image\/png'\);/,
  'const url = await toPng(el, { pixelRatio: 2 });'
);

fs.writeFileSync('src/pages/CheckoutPage.tsx', content);
