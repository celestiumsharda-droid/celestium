import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
await p.goto("http://localhost:4339/",{waitUntil:"networkidle"}); await p.waitForTimeout(800);
await p.click("#lnch-home").catch(()=>{}); await p.waitForTimeout(1400);
const info = await p.evaluate(()=>{
  const deck=document.querySelector(".lnch-deck"), grid=document.querySelector(".lnch-grid"), t=document.querySelector(".tile");
  const ds=getComputedStyle(deck), gs=getComputedStyle(grid), ts=getComputedStyle(t);
  return {
    deck:{ flexDir:ds.flexDirection, justify:ds.justifyContent, align:ds.alignItems },
    grid:{ autoRows:gs.gridAutoRows, alignItems:gs.alignItems, justifyItems:gs.justifyItems, h:grid.clientHeight, cols:gs.gridTemplateColumns.slice(0,40) },
    tile:{ h:t.clientHeight, alignSelf:ts.alignSelf, gridRow:ts.gridRowStart+"/"+ts.gridRowEnd, position:ts.position, display:ts.display }
  };
});
console.log(JSON.stringify(info,null,1));
await b.close();
