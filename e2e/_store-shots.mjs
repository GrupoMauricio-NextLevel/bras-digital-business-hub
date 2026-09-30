import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const B = "http://localhost:3100", out = process.argv[2]; mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const slugs = ["mrs-sports", "mantos-shop", "arena-10"];
for (const s of slugs) for (const [w, n] of [[1280, "d"], [390, "m"]]) {
  await p.setViewportSize({ width: w, height: 900 });
  const r = await p.goto(`${B}/store/${s}`, { waitUntil: "networkidle" });
  await p.screenshot({ path: `${out}/${s}-${n}.png`, fullPage: true });
  console.log(s, n, r?.status(), await p.evaluate(() => document.documentElement.scrollHeight));
}
await b.close();
