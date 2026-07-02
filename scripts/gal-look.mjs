import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1600,height:1000}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
await p.goto("http://localhost:4352/atlas/",{waitUntil:"domcontentloaded"}); await p.waitForTimeout(1500);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:35000}).catch(()=>{}); await p.waitForTimeout(8000);
// full galaxy view (face-on, down the pole)
await p.evaluate(()=>window.__atlasGalView&&window.__atlasGalView());
await p.waitForTimeout(6000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/gal-view-1.png"});
// pull the distance in a bit to see the disk larger + any labels
await p.evaluate(()=>window.__atlasDist&&window.__atlasDist(4e17)); await p.waitForTimeout(4000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/gal-view-2.png"});
await p.evaluate(()=>window.__atlasDist&&window.__atlasDist(1.4e18)); await p.waitForTimeout(4000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/gal-view-3.png"});
console.log("galaxy views captured");
await b.close();
