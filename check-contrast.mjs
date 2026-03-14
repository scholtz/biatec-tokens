import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5173/');
await page.waitForLoadState('load');
await new Promise(r => setTimeout(r, 2000));

const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
  .analyze();

const contrastViolations = results.violations.filter(v => v.id === 'color-contrast');
if (contrastViolations.length > 0) {
  contrastViolations[0].nodes.forEach((node, i) => {
    console.log(`\nNode ${i+1}:`);
    console.log('HTML:', node.html.slice(0, 300));
    node.any.forEach(item => {
      if (item.data) console.log('Contrast data:', JSON.stringify(item.data).slice(0, 300));
    });
  });
} else {
  console.log('No color-contrast violations');
}

await browser.close();
