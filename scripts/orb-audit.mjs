import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1600,height:1000}, deviceScaleFactor:2 });
const p = await ctx.newPage();
await p.goto("http://localhost:4360/",{waitUntil:"domcontentloaded"});
await p.waitForTimeout(3000);
const orb = await p.locator("#lnch-home").boundingBox();
// idle
await p.screenshot({path:"C:/Users/devan/celestium/.shots/orb-idle.png", clip:{x:orb.x-40,y:orb.y-40,width:orb.width+80,height:orb.height+80}});
// hover (wake)
await p.mouse.move(orb.x+orb.width/2, orb.y+orb.height/2, {steps:16});
await p.waitForTimeout(1800);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/orb-wake.png", clip:{x:orb.x-40,y:orb.y-40,width:orb.width+80,height:orb.height+80}});
// press (implode)
await p.mouse.down(); await p.waitForTimeout(420);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/orb-press.png", clip:{x:orb.x-40,y:orb.y-40,width:orb.width+80,height:orb.height+80}});
await p.mouse.up();
console.log("orb states captured");
await b.close();
