import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
const errs=[]; p.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,120))}); p.on("pageerror",e=>errs.push("PE:"+e.message.slice(0,120)));
await p.goto("http://localhost:4339/",{waitUntil:"networkidle"});
await p.waitForTimeout(14000);   // let the engine lazy-load, warm textures, and fly to Earth
const state = await p.evaluate(()=>({ on: document.getElementById("cine-bg")?.classList.contains("on"), fly: typeof window.__atlasFly }));
await p.screenshot({path:"C:/Users/devan/celestium/.shots/cine-earth.png"});
await p.waitForTimeout(9500);    // hyperdrive to the next scene (Saturn)
await p.screenshot({path:"C:/Users/devan/celestium/.shots/cine-saturn.png"});
console.log("state:", JSON.stringify(state), "| errors:", errs.length?errs.slice(0,4):"none");
await b.close();
