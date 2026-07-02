import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const errs=[];
async function shot(vp, tag){
  const ctx = await b.newContext({ viewport:vp.v, deviceScaleFactor:vp.d, isMobile:vp.m, hasTouch:vp.m });
  const p = await ctx.newPage();
  p.on("pageerror",e=>errs.push(tag+":PE:"+e.message));
  await p.goto("http://localhost:4339/",{waitUntil:"networkidle"}); await p.waitForTimeout(1500);
  await p.screenshot({path:`C:/Users/devan/celestium/.shots/lnch-${tag}-closed.png`});
  await p.click("#lnch-home").catch(()=>{}); await p.waitForTimeout(1100);
  await p.screenshot({path:`C:/Users/devan/celestium/.shots/lnch-${tag}-open.png`});
  await ctx.close();
}
await shot({v:{width:412,height:900},d:2,m:true},"m");
await shot({v:{width:1440,height:900},d:1.25,m:false},"d");
console.log("errors:", errs.length?errs:"none");
await b.close();
