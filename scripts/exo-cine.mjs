import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1800,height:1440}, deviceScaleFactor:1.5 });
const p = await ctx.newPage();
await p.goto("http://localhost:4352/atlas/",{waitUntil:"domcontentloaded"}); await p.waitForTimeout(1500);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:35000}).catch(()=>{}); await p.waitForTimeout(8000);
await p.addStyleTag({content:`#nav,#menu,#burger,#prog,.at-hud,.at-labels,.at-nav,.at-console,.at-sheet,.at-ground,.at-hint,.at-timewrap,.at-readout,.grain,.cursor,.cur,#cursor{display:none!important;visibility:hidden!important;} body{cursor:none!important;}`});
const cx=900, cy=720;
const clean = async () => { await p.evaluate(()=>window.__atlasClean&&window.__atlasClean()); };
const setDist = async (d) => { await p.evaluate(x=>window.__atlasDist&&window.__atlasDist(x), d); };
async function orbit(dx,dy){ await p.mouse.move(cx,cy); await p.mouse.down(); for(let i=1;i<=14;i++){ await p.mouse.move(cx+dx*i/14, cy+dy*i/14); await p.waitForTimeout(16);} await p.mouse.up(); }
// warm up the first interstellar fly
await p.evaluate(()=>window.__atlasFly&&window.__atlasFly("HD 209458 b")); await p.waitForTimeout(5000);
const shots = [["HD 209458 b",430000,240],["KELT-9 b",560000,0],["Kepler-452 b",30000,0]];
for (const [name,dist,drag] of shots){
  await p.evaluate(n=>window.__atlasFly&&window.__atlasFly(n), name);
  await p.waitForTimeout(4500);
  await setDist(dist); await p.waitForTimeout(2500); await setDist(dist); await p.waitForTimeout(1200);
  await clean(); await p.waitForTimeout(500); await clean();
  const tag = name.replace(/[^a-z0-9]+/gi,"_");
  await p.screenshot({path:`C:/Users/devan/celestium/.shots/cl-${tag}-a.png`});
  if (drag){ await orbit(drag,-40); await p.waitForTimeout(1400); await clean(); await p.waitForTimeout(300); await clean();
    await p.screenshot({path:`C:/Users/devan/celestium/.shots/cl-${tag}-b.png`}); }
}
console.log("clean cine done");
await b.close();
