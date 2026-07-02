import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:412,height:900}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
const p = await ctx.newPage();
const errs=[]; p.on("console",m=>{if(m.type()==="error")errs.push(m.text())}); p.on("pageerror",e=>errs.push("PE:"+e.message));
await p.goto("http://localhost:4339/atlas/",{waitUntil:"networkidle"}); await p.waitForTimeout(700);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:20000}).catch(()=>{}); await p.waitForTimeout(4000);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/beacon-closed.png"});
await p.click("#at-nav").catch(()=>{}); await p.waitForTimeout(800);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/beacon-open.png"});
await p.fill("#at-con-search","sa").catch(()=>{}); await p.waitForTimeout(700);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/beacon-search.png"});
// now over the galaxy
await p.evaluate(()=>window.__atlasGalView && window.__atlasGalView()); await p.waitForTimeout(6000);
await p.click("#at-con-close").catch(()=>{}); await p.waitForTimeout(400);
await p.click("#at-nav").catch(()=>{}); await p.waitForTimeout(700);
await p.screenshot({path:"C:/Users/devan/celestium/.shots/beacon-galaxy.png"});
console.log("errors:", errs.length?errs.slice(0,5):"none");
await b.close();
