const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // PRD
  const prdPath = 'file://' + path.resolve(__dirname, 'prd.html').replace(/\\/g, '/');
  await page.goto(prdPath, { waitUntil: 'networkidle' });
  await page.pdf({ path: path.resolve(__dirname, 'prd.pdf'), format: 'A4', printBackground: true });
  
  // User Manual
  const manualPath = 'file://' + path.resolve(__dirname, 'user_manual.html').replace(/\\/g, '/');
  await page.goto(manualPath, { waitUntil: 'networkidle' });
  await page.pdf({ path: path.resolve(__dirname, 'user_manual.pdf'), format: 'A4', printBackground: true });

  await browser.close();
  console.log('PDFs generated successfully!');
})();
