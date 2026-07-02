import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:412,height:900}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
const p = await ctx.newPage();
await p.goto("http://localhost:4335/atlas/",{waitUntil:"networkidle"}); await p.waitForTimeout(700);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:20000}).catch(()=>{}); await p.waitForTimeout(3500);
await p.click("#at-nav").catch(()=>{}); await p.waitForTimeout(1100);
const info = await p.evaluate(()=>{
  const l=document.querySelector("#at-con-list"); const c=l?.querySelector(".at-card");
  document.querySelectorAll(".at-card").forEach(x=>x.style.outline="2px solid red");
  l.style.outline="3px solid lime";
  const op = c?.offsetParent; 
  return { offsetTop:c?.offsetTop, offsetParentClass: op?op.className||op.id:null,
    listOverflow:getComputedStyle(l).overflow, cardTransform:getComputedStyle(c).transform,
    cardPos:getComputedStyle(c).position, listPos:getComputedStyle(l).position };
});
await p.screenshot({path:"C:/Users/devan/celestium/.shots/nav-outline.png"});
console.log(JSON.stringify(info,null,1));
await b.close();
