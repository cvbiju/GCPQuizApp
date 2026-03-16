const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to a common laptop size
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8001');

  // Wait for animations
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Take a full page screenshot to verify scrollbars
  const outputPath = path.join('/Users/bchandr1/.gemini/antigravity/brain/1f72cd5a-2f8d-4b7c-a997-754b15ed0b68', 'final_quiz_app_screenshot.webp');
  await page.screenshot({ path: outputPath, type: 'webp', quality: 90 });
  
  console.log(`Screenshot saved to: ${outputPath}`);

  await browser.close();
})();
