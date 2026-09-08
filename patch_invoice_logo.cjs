const fs = require('fs');
let code = fs.readFileSync('src/utils/generateInvoice.ts', 'utf8');

const logoCode = `
    // Add Logo
    try {
      const res = await fetch('/images/oda-logo.png.jpeg');
      if (!res.ok) throw new Error('Failed to fetch logo');
      const blob = await res.blob();
      const base64data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      // ODA Market logo is 2115x1153 (approx 1.83:1)
      doc.addImage(base64data, 'PNG', margin, 10, 40, 22, undefined, 'FAST');
      currentY = 35;
    } catch (e) {
      console.warn("Could not load logo for invoice", e);
      // Header Text Fallback
      doc.setFontSize(22);
      doc.setTextColor(198, 90, 40); // ODA Market primary color #C65A28
      doc.text("ODA Market", margin, currentY);
      currentY = 28;
    }
`;

code = code.replace(
  /\/\/ Header[\s\S]*?doc\.text\("Your Trusted Local Marketplace", margin, currentY \+ 6\);/g,
  `${logoCode}\n    doc.setFontSize(10);\n    doc.setTextColor(100, 100, 100);\n    doc.text("Your Trusted Local Marketplace", margin, currentY);`
);

// We need to adjust Invoice Title Y since we modified currentY
// Originally currentY was 20.
// Invoice Title Y was 20. Let's make it 25.
code = code.replace(
  /\/\/ Invoice Title\s*doc\.setFontSize\(20\);\s*doc\.setTextColor\(0, 0, 0\);\s*doc\.text\("INVOICE", 150, currentY\);/g,
  `// Invoice Title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("INVOICE", 150, 25);`
);

fs.writeFileSync('src/utils/generateInvoice.ts', code);
