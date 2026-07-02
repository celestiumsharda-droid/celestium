import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
const errs=[]; p.on("pageerror",e=>errs.push("PE:"+e.message.slice(0,100)));
await p.goto("http://localhost:4339/",{waitUntil:"networkidle"});
// wait for the engine to load + hooks to exist
for (let t=0;t<30;t++){ const ok=await p.evaluate(()=>typeof window.__atlasFly==="function"); if(ok) break; await p.waitForTimeout(1000); }
async function frame(name, dist, tag){
  await p.evaluate(n=>window.__atlasFly&&window.__atlasFly(n), name);
  await p.waitForTimeout(2600);
  await p.evaluate(d=>window.__atlasDist&&window.__atlasDist(d), dist);
  await p.waitForTimeout(4200);
  await p.screenshot({path:`C:/Users/devan/celestium/.shots/cine2-${tag}.png`});
}
await frame("Earth",16000,"earth");
await frame("Saturn",230000,"saturn");
await p.evaluate(()=>window.__atlasGalView&&window.__atlasGalView()); await p.waitForTimeout(6000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/cine2-galaxy.png"});
console.log("errors:", errs.length?errs:"none");
await b.close();
