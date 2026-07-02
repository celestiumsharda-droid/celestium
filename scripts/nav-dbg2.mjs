import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:412,height:900}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
const p = await ctx.newPage();
await p.goto("http://localhost:4335/atlas/",{waitUntil:"networkidle"}); await p.waitForTimeout(700);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:20000}).catch(()=>{}); await p.waitForTimeout(3500);
await p.click("#at-nav").catch(()=>{}); await p.waitForTimeout(1100);
const info = await p.evaluate(()=>{
  const con=document.querySelector("#at-console"), l=document.querySelector("#at-con-list"), c=l?.querySelector(".at-card");
  const cs=getComputedStyle(con), ls=getComputedStyle(l), ccs=c?getComputedStyle(c):null;
  return {
    con:{display:cs.display, flexDir:cs.flexDirection, h:con.clientHeight, maxH:cs.maxHeight},
    list:{display:ls.display, flex:ls.flex, h:l.clientHeight, minH:ls.minHeight},
    card:ccs?{display:ccs.display, h:c.clientHeight, padding:ccs.padding}:null
  };
});
console.log(JSON.stringify(info,null,1));
await b.close();
