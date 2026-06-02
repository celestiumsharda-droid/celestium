import { chromium } from "playwright";
import lighthouse from "lighthouse";

const BASE = "http://localhost:4173";
const PORT = 9222;
const paths = process.argv.slice(2);
if (paths.length === 0) paths.push("/");

const browser = await chromium.launch({
  args: [`--remote-debugging-port=${PORT}`, "--no-sandbox", "--disable-gpu"],
});
await new Promise(r => setTimeout(r, 800));

for (const path of paths) {
  try {
    const result = await lighthouse(BASE + path, {
      port: PORT,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });
    const c = result.lhr.categories;
    const pct = (x) => (x == null ? "—" : Math.round(x * 100));
    console.log(
      `\n=== ${path} ===\n` +
      `  Performance ${pct(c.performance?.score)}  |  Accessibility ${pct(c.accessibility?.score)}  |  Best-Practices ${pct(c["best-practices"]?.score)}  |  SEO ${pct(c.seo?.score)}`,
    );
    const a = result.lhr.audits;
    const fails = Object.values(a).filter(x => x.score !== null && x.score < 1 && x.scoreDisplayMode !== "informative");
    if (fails.length) {
      for (const f of fails.slice(0, 20)) console.log(`   • [${Math.round((f.score || 0) * 100)}] ${f.id} — ${f.title}`);
    } else {
      console.log("   (no failing audits)");
    }
  } catch (e) {
    console.log(`\n=== ${path} === ERROR: ${String(e).slice(0, 160)}`);
  }
}

await browser.close();
