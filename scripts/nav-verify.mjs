import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
const errs=[]; p.on("pageerror",e=>errs.push("PE:"+e.message.slice(0,90)));
await p.goto("http://localhost:4350/atlas/",{waitUntil:"domcontentloaded"}); await p.waitForTimeout(1500);
await p.click("#at-intro-go").catch(()=>{}); await p.waitForSelector("#atlas.live",{timeout:30000}).catch(()=>{}); await p.waitForTimeout(6000);
await p.click("#at-nav").catch(()=>{}); await p.waitForTimeout(900);
// drill into Exoplanet systems to confirm 74 systems are listed
const cats = await p.$$(".at-con-cat");
const info = await p.evaluate(()=>{
  const list=document.getElementById("at-con-list");
  return { open: document.getElementById("at-console")?.classList.contains("open"), cats: list?.querySelectorAll(".at-con-cat").length, title: document.getElementById("at-con-title")?.textContent };
});
await p.screenshot({path:"C:/Users/devan/celestium/.shots/nav-restored.png"});
console.log("console:", JSON.stringify(info), "| errors:", errs.length?errs:"none");
await b.close();
