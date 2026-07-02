import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:412,height:900}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
const p = await ctx.newPage();
await p.goto("http://localhost:4335/atlas/",{waitUntil:"networkidle"}); await p.waitForTimeout(700);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:20000}).catch(()=>{}); await p.waitForTimeout(3500);
await p.click("#at-nav").catch(()=>{}); await p.waitForTimeout(1100);
const info = await p.evaluate(()=>{
  const l=document.querySelector("#at-con-list"); const c=l?.querySelector(".at-card");
  const cr=c?.getBoundingClientRect(); const lr=l?.getBoundingClientRect();
  const cm=c?.querySelector(".at-card-main"); const nm=c?.querySelector(".at-card-name");
  return { listH:l?.clientHeight, listScroll:l?.scrollHeight, listRect:lr?{y:Math.round(lr.y),h:Math.round(lr.height)}:null,
    cardRect: cr?{y:Math.round(cr.y),h:Math.round(cr.height),w:Math.round(cr.width)}:null,
    cardDisp: c?getComputedStyle(c).display:null,
    mainW: cm?Math.round(cm.getBoundingClientRect().width):null,
    nameTxt: nm?.textContent, nameColor: nm?getComputedStyle(nm).color:null, nameH: nm?Math.round(nm.getBoundingClientRect().height):null };
});
console.log(JSON.stringify(info,null,1));
await b.close();
