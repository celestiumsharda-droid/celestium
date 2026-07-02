import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:412,height:900}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
const p = await ctx.newPage();
await p.goto("http://localhost:4335/atlas/",{waitUntil:"networkidle"}); await p.waitForTimeout(700);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:20000}).catch(()=>{}); await p.waitForTimeout(3500);
await p.click("#at-nav").catch(()=>{}); await p.waitForTimeout(700);
await p.click("#at-con-back").catch(()=>{}); await p.waitForTimeout(600);   // back to root ladder
await p.screenshot({path:"C:/Users/devan/celestium/.shots/nav-ladder.png"});
await b.close();
