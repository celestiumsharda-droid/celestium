import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1600,height:1000}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
const errs = [];
p.on("console", m => { if (m.type()==="error") errs.push(m.text().slice(0,140)); });
p.on("pageerror", e => errs.push("PAGE: "+String(e).slice(0,140)));

// 1. home closed — cinematic second shot for variety
await p.goto("http://localhost:4360/",{waitUntil:"domcontentloaded"});
await p.waitForTimeout(24000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/f-home.png"});
// 2. deck open — tiles with live tonight rows
await p.click("#lnch-home");
await p.waitForTimeout(1500);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/f-deck.png"});
// tilt check: hover a tile
const tile = await p.locator(".t-disc").boundingBox();
await p.mouse.move(tile.x+tile.width*0.8, tile.y+tile.height*0.25, {steps:10});
await p.waitForTimeout(700);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/f-tilt.png"});
// 3. tonight page
await p.goto("http://localhost:4360/tonight/",{waitUntil:"domcontentloaded"});
await p.waitForTimeout(6000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/f-tonight.png", fullPage:true});
// 4. atlas page still alive
await p.goto("http://localhost:4360/atlas/",{waitUntil:"domcontentloaded"});
await p.waitForTimeout(2000);
await p.click("#at-intro-go").catch(()=>{});
await p.waitForSelector("#atlas.live",{timeout:35000}).catch(()=>errs.push("atlas never went live"));
await p.waitForTimeout(6000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/f-atlas.png"});
console.log("errors:", errs.length ? errs.slice(0,6) : "none");
await b.close();
