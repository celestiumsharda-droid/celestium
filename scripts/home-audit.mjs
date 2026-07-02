import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1600,height:1000}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
await p.goto("http://localhost:4360/",{waitUntil:"domcontentloaded"});
await p.waitForTimeout(3500);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/home-closed.png"});
await p.click("#lnch-home").catch(e=>console.log("orb click fail:",e.message));
await p.waitForTimeout(1600);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/home-deck.png"});
// tonight tile press
await p.click("#tile-tonight").catch(e=>console.log("tonight click fail:",e.message));
await p.waitForTimeout(1200);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/home-tonight-press.png"});
console.log("done", p.url());
await b.close();
