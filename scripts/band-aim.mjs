import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1700,height:1050}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
await p.goto("http://localhost:4352/atlas/",{waitUntil:"domcontentloaded"}); await p.waitForTimeout(1500);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:35000}).catch(()=>{}); await p.waitForTimeout(7000);
await p.evaluate(()=>window.__atlasFly&&window.__atlasFly("Earth")); await p.waitForTimeout(2500);
await p.evaluate(()=>window.__atlasDist&&window.__atlasDist(8e6)); await p.waitForTimeout(2000);
// hide HUD/labels/orbit-lines so we judge the SKY only
await p.addStyleTag({content:`#nav,#menu,.at-hud,.at-labels,.at-nav,.at-ground,.at-hint,.at-timewrap,.at-readout,.grain{display:none!important;}`});
const cx=850, cy=525;
async function drag(dx,dy){ await p.mouse.move(cx,cy); await p.mouse.down(); for(let i=1;i<=18;i++){ await p.mouse.move(cx+dx*i/18, cy+dy*i/18); await p.waitForTimeout(15);} await p.mouse.up(); await p.waitForTimeout(1000); }
// sweep pitch + yaw to locate the band arch
const seq=[[0,-300],[300,-160],[300,0],[0,-300]];
for (let k=0;k<seq.length;k++){ await drag(seq[k][0],seq[k][1]); await p.screenshot({path:`C:/Users/devan/celestium/.shots/aim-${k}.png`}); }
console.log("aim captured");
await b.close();
