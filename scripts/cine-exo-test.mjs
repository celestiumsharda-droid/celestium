import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1600,height:1000}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
await p.goto("http://localhost:4360/",{waitUntil:"domcontentloaded"});
await p.waitForFunction(() => document.body.classList.contains("cine-live"), null, {timeout:25000});
await p.waitForTimeout(4000); // far universe streams in
await p.evaluate(() => window.__atlasCine({ name:"55 Cnc e", radii:2.9, offX:0.32, offY:-0.02, driftYaw:0.02, dolly:-0.004 }));
await p.waitForTimeout(9000);  // hyperdrive + settle
await p.screenshot({path:"C:/Users/devan/celestium/.shots/cine-exo.png"});
console.log("exo shot done");
await b.close();
