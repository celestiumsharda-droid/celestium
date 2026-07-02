import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1200,height:1200}, deviceScaleFactor:1.5 });
const p = await ctx.newPage();
await p.goto("http://localhost:4351/atlas/",{waitUntil:"domcontentloaded"}); await p.waitForTimeout(1200);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:30000}).catch(()=>{}); await p.waitForTimeout(6000);
// strip ALL chrome — leave only the 3-D canvas for a clean cinematic render
await p.addStyleTag({content:`#nav,#menu,#burger,#prog,.at-hud,.at-labels,.at-nav,.at-console,.at-sheet,.at-ground,.at-hint,.at-timewrap,.at-readout,.grain,.cursor,.cur,#cursor{display:none!important;visibility:hidden!important;} body{cursor:none!important;}`});
const shots = [["KELT-9 b",460000],["55 Cnc e",33000],["Kepler-452 b",25000]];
for (const [name,dist] of shots){
  await p.evaluate(n=>window.__atlasFly&&window.__atlasFly(n), name);
  await p.waitForTimeout(2800);
  await p.evaluate(d=>window.__atlasDist&&window.__atlasDist(d), dist);
  await p.waitForTimeout(4000);
  const tag = name.replace(/[^a-z0-9]+/gi,"_");
  await p.screenshot({path:`C:/Users/devan/celestium/.shots/exo-${tag}.png`});
}
console.log("clean renders:", shots.map(s=>s[0]).join(", "));
await b.close();
