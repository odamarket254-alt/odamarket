import fs from 'fs';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import path from 'path';

// High-end logo SVG (Light Mode Horizontal)
const svgLogo = `<svg viewBox="0 0 500 120" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(10, 10)">
    <path d="M50 5 L90 28 V72 L50 95 L10 72 V28 Z" fill="none" stroke="#16A34A" stroke-width="12" stroke-linejoin="round"/>
    <path d="M50 25 L75 40 V65 L50 80 L25 65 V40 Z" fill="#111827"/>
    <path d="M25 40 L50 25 L75 40 L50 55 Z" fill="#22C55E"/>
  </g>
  <text x="125" y="76" font-family="'Inter', -apple-system, sans-serif" font-weight="800" font-size="64" letter-spacing="-0.03em" fill="#111827">Oda<tspan fill="#16A34A">Market</tspan></text>
</svg>`;

// Icon-only SVG
const svgIcon = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M50 5 L90 28 V72 L50 95 L10 72 V28 Z" fill="none" stroke="#16A34A" stroke-width="12" stroke-linejoin="round"/>
  <path d="M50 25 L75 40 V65 L50 80 L25 65 V40 Z" fill="#111827"/>
  <path d="M25 40 L50 25 L75 40 L50 55 Z" fill="#22C55E"/>
</svg>`;

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generate() {
  try {
    // Generate Horizontal Logo PNG
    const logoBuffer = await sharp(Buffer.from(svgLogo))
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(publicDir, 'logo.png'), logoBuffer);
    
    // Generate icon buffer
    const iconBuffer = await sharp(Buffer.from(svgIcon)).png().toBuffer();

    // Generate specific sized icons
    await sharp(iconBuffer)
      .resize(48, 48, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(path.join(publicDir, 'favicon.png'));
      
    await sharp(iconBuffer)
      .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    
    // Generate ICO for legacy fallback
    const icoBuf = await pngToIco([path.join(publicDir, 'favicon.png')]);
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuf);
    
    console.log("Premium icons and logos generated successfully in public directory!");
  } catch (err) {
    console.error(err);
  }
}

generate();

