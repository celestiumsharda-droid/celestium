import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1600,height:1000}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
p.on("console", m => { if (m.type()==="error"||m.type()==="warning") console.log("[con]", m.text().slice(0,160)); });
await p.goto("http://localhost:4360/",{waitUntil:"domcontentloaded"});
// wait for the engine to mount + first shot (Earth) to settle
await p.waitForTimeout(11000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/cine-1-earth.png"});
// second shot (Moon) — travel + dwell
await p.waitForTimeout(15000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/cine-2.png"});
await p.waitForTimeout(15000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/cine-3.png"});
const live = await p.evaluate(() => document.body.classList.contains("cine-live"));
console.log("cine-live:", live);
await b.close();
