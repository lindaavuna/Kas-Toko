const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="50%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#022c22" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Background rounded squircle with safe margin for PWA maskable icon -->
  <rect width="512" height="512" fill="url(#bgGrad)" />

  <!-- Main POS register icon with drop shadow -->
  <g filter="url(#shadow)" transform="translate(40, 36)">
    <!-- Storefront Canopy / Awning -->
    <path d="M 56 120 Q 216 70 376 120 L 396 160 Q 216 130 36 160 Z" fill="#ffffff" opacity="0.95" />
    <path d="M 86 120 L 106 160 M 156 112 L 166 156 M 226 108 L 226 154 M 296 112 L 286 156 M 346 120 L 326 160" stroke="#059669" stroke-width="8" stroke-linecap="round" />

    <!-- POS Register Body -->
    <rect x="76" y="165" width="280" height="210" rx="28" fill="#ffffff" />
    
    <!-- Screen Display -->
    <rect x="106" y="195" width="220" height="90" rx="14" fill="url(#screenGrad)" />
    <!-- Screen Content: Emerald Glowing 'Rp' & Barcode pulse -->
    <text x="126" y="248" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="#34d399">Rp</text>
    <text x="175" y="252" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace" font-size="34" font-weight="700" fill="#ffffff">KASTOKO</text>
    <rect x="126" y="266" width="180" height="4" rx="2" fill="#10b981" opacity="0.7" />

    <!-- Tactile Keypad Grid -->
    <g fill="#e2e8f0">
      <!-- Row 1 -->
      <rect x="112" y="306" width="34" height="22" rx="6" />
      <rect x="156" y="306" width="34" height="22" rx="6" />
      <rect x="200" y="306" width="34" height="22" rx="6" />
      <rect x="244" y="306" width="76" height="22" rx="6" fill="#10b981" />
      <!-- Row 2 -->
      <rect x="112" y="338" width="34" height="22" rx="6" />
      <rect x="156" y="338" width="34" height="22" rx="6" />
      <rect x="200" y="338" width="34" height="22" rx="6" />
      <rect x="244" y="338" width="76" height="22" rx="6" fill="#059669" />
    </g>

    <!-- Cash Drawer Base -->
    <rect x="56" y="380" width="320" height="42" rx="12" fill="#cbd5e1" />
    <rect x="76" y="386" width="280" height="30" rx="8" fill="#f8fafc" />
    <!-- Drawer Lock / Keyhole -->
    <circle cx="216" cy="401" r="5" fill="#64748b" />
  </g>
</svg>
`;

async function main() {
  const publicDir = path.join(__dirname, "../public");
  fs.writeFileSync(path.join(publicDir, "icon.svg"), svgContent);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: transparent; }
          svg { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await page.setContent(html);

  // 1. 512x512 icon
  await page.setViewportSize({ width: 512, height: 512 });
  await page.screenshot({ path: path.join(publicDir, "icon-512.png") });
  console.log("Wrote public/icon-512.png");

  // 2. 192x192 icon
  await page.setViewportSize({ width: 192, height: 192 });
  await page.screenshot({ path: path.join(publicDir, "icon-192.png") });
  console.log("Wrote public/icon-192.png");

  // 3. Apple Touch Icon 180x180
  await page.setViewportSize({ width: 180, height: 180 });
  await page.screenshot({ path: path.join(publicDir, "apple-touch-icon.png") });
  console.log("Wrote public/apple-touch-icon.png");

  await browser.close();
  console.log("PWA icon generation complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
