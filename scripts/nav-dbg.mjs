import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:412,height:900}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
const p = await ctx.newPage();
const errs=[]; p.on("console",m=>{if(m.type()==="error")errs.push(m.text())}); p.on("pageerror",e=>errs.push("PE:"+e.message));
await p.goto("http://localhost:4335/atlas/",{waitUntil:"networkidle"}); await p.waitForTimeout(700);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:20000}).catch(()=>{}); await p.waitForTimeout(3500);
await p.click("#at-nav").catch(()=>{}); await p.waitForTimeout(1100);
const info = await p.evaluate(()=>{
  const l=document.querySelector("#at-con-list");
  return { cards: l?l.querySelectorAll(".at-card").length:-1, heads: l?l.querySelectorAll(".at-ladder-h").length:-1,
           h: l?l.clientHeight:-1, firstHTML: l?l.innerHTML.slice(0,180):"" };
});
console.log("errors:", errs.length?errs.slice(0,4):"none");
console.log(JSON.stringify(info,null,1));
await b.close();
