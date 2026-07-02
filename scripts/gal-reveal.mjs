import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
const errs=[]; p.on("pageerror",e=>errs.push("PE:"+e.message));
await p.goto("http://localhost:4335/atlas/",{waitUntil:"networkidle"}); await p.waitForTimeout(700);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:20000}).catch(()=>{}); await p.waitForTimeout(7000);
await p.evaluate(()=>window.__atlasGalView && window.__atlasGalView());
for (const [t,name] of [[350,"a"],[450,"b"],[700,"c"],[1400,"d"]]) {
  await p.waitForTimeout(t);
  await p.screenshot({path:`C:/Users/devan/celestium/.shots/reveal-${name}.png`});
}
console.log("reveal frames captured | errors:",errs.length?errs:"none");
await b.close();
