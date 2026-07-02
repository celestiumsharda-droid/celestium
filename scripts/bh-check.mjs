import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1600,height:1000}, deviceScaleFactor:1.1 });
const p = await ctx.newPage();
await p.goto("http://localhost:4352/atlas/",{waitUntil:"domcontentloaded"}); await p.waitForTimeout(1500);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:35000}).catch(()=>{}); await p.waitForTimeout(7000);
// dive to the black hole up close — the white-out scenario
await p.evaluate(()=>window.__atlasFly&&window.__atlasFly("Sagittarius A*")); await p.waitForTimeout(3000);
await p.evaluate(()=>window.__atlasDist&&window.__atlasDist(2e9)); await p.waitForTimeout(3500);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/bh-close.png"});
// pull out to the galaxy view to confirm it still looks right
await p.evaluate(()=>window.__atlasDist&&window.__atlasDist(9e17)); await p.waitForTimeout(4000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/bh-galaxy.png"});
console.log("bh check done");
await b.close();
