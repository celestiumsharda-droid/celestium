import { chromium } from "playwright";
const b = await chromium.launch({ args:["--use-angle=d3d11","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:1.25 });
const p = await ctx.newPage();
const reqs=[]; p.on("requestfailed",r=>{ if(r.url().includes("/img/")) reqs.push("FAIL "+r.url().split("/").pop()); });
await p.goto("http://localhost:4339/",{waitUntil:"networkidle"}); await p.waitForTimeout(800);
await p.click("#lnch-home").catch(()=>{}); await p.waitForTimeout(1200);
const info = await p.evaluate(()=>{
  const deck=document.querySelector(".lnch-deck"), grid=document.querySelector(".lnch-grid"), t=document.querySelector(".tile");
  const bg=document.querySelector(".tile-bg, .slide");
  const dr=deck.getBoundingClientRect(), gr=grid.getBoundingClientRect(), tr=t?.getBoundingClientRect();
  return { deckDisplay:getComputedStyle(deck).display, deck:{w:Math.round(dr.width),h:Math.round(dr.height)},
    grid:{w:Math.round(gr.width),h:Math.round(gr.height),x:Math.round(gr.x)},
    tile:tr?{w:Math.round(tr.width),h:Math.round(tr.height)}:null,
    bgImg: bg?getComputedStyle(bg).backgroundImage.slice(0,60):null, tiles:document.querySelectorAll(".tile").length };
});
console.log("failed imgs:", reqs.length?reqs:"none");
console.log(JSON.stringify(info,null,1));
await b.close();
