const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const paths = ['/', '/discoveries/', '/discoveries/black-hole-image/', '/nonexistent-xyz'];
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
    page.on('pageerror', e => errors.push('PAGEERROR ' + e.message.slice(0, 120)));
    const resp = await page.goto('http://localhost:4173' + path, { waitUntil: 'networkidle' }).catch(() => null);
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')];
      return {
        title: document.title,
        h1: document.querySelectorAll('h1').length,
        landmarks: ['main', 'nav', 'footer', 'header'].filter(t => document.querySelector(t)).join(','),
        imgsNoAlt: imgs.filter(i => !i.getAttribute('alt')).length,
        imgCount: imgs.length,
        jsonld: document.querySelectorAll('script[type="application/ld+json"]').length,
        // crawler view: text length of <article>/<main> in the *served* DOM after JS
        articleTextLen: (document.querySelector('article')?.innerText || '').length,
      };
    });
    console.log(`\n=== ${path} (HTTP ${resp ? resp.status() : '??'}) ===`);
    console.log('  title:', info.title.slice(0, 60));
    console.log('  h1s:', info.h1, '| landmarks:', info.landmarks, '| JSON-LD:', info.jsonld);
    console.log('  imgs:', info.imgCount, '| missing alt:', info.imgsNoAlt, '| article innerText len:', info.articleTextLen);
    if (errors.length) console.log('  CONSOLE ERRORS:', [...new Set(errors)].slice(0, 6));
    await page.close();
  }
  // What a no-JS crawler sees: raw HTML article body length
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto('http://localhost:4173/discoveries/black-hole-image/', { waitUntil: 'domcontentloaded' }).catch(()=>{});
  const raw = await page.evaluate(() => (document.querySelector('#abody')?.innerHTML || '').length);
  console.log('\n=== NO-JS crawler: #abody raw HTML length =', raw, '(0 = empty page for crawlers)');
  await browser.close();
})();
