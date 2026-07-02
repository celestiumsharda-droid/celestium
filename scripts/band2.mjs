import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1700,height:1050}, deviceScaleFactor:1.2 });
const p = await ctx.newPage();
await p.goto("http://localhost:4352/atlas/",{waitUntil:"domcontentloaded"}); await p.waitForTimeout(1500);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:35000}).catch(()=>{}); await p.waitForTimeout(9000);
await p.addStyleTag({content:`#nav,#menu,.at-hud,.at-labels,.at-nav,.at-ground,.at-hint,.at-timewrap,.at-readout,.grain{display:none!important;}`});
await p.evaluate(()=>window.__atlasBand&&window.__atlasBand()); await p.waitForTimeout(4000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/band-gc.png"});
// widen the view a touch by pulling back
await p.evaluate(()=>window.__atlasDist&&window.__atlasDist(9e7)); await p.waitForTimeout(2500);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/band-gc2.png"});
console.log("band GC captured");
await b.close();
