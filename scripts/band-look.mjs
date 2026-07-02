import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1600,height:1000}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
await p.goto("http://localhost:4352/atlas/",{waitUntil:"domcontentloaded"}); await p.waitForTimeout(1500);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:35000}).catch(()=>{}); await p.waitForTimeout(7000);
// pull back from Earth to a few million km so the whole sky (with the band) shows
await p.evaluate(()=>window.__atlasFly&&window.__atlasFly("Earth")); await p.waitForTimeout(2500);
await p.evaluate(()=>window.__atlasDist&&window.__atlasDist(9e6)); await p.waitForTimeout(2500);
const cx=800, cy=500;
async function orbit(dx){ await p.mouse.move(cx,cy); await p.mouse.down(); for(let i=1;i<=16;i++){ await p.mouse.move(cx+dx*i/16, cy); await p.waitForTimeout(16);} await p.mouse.up(); await p.waitForTimeout(1200); }
for (let k=0;k<4;k++){ await p.screenshot({path:`C:/Users/devan/celestium/.shots/band-${k}.png`}); await orbit(360); }
console.log("band views captured");
await b.close();
