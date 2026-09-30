import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
const B = "http://localhost:3100", out = process.argv[2]; mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
for (const s of ["mantos-shop", "arena-10"]) {
  await p.goto(`${B}/store/${s}`, { waitUntil: "networkidle" });
  const href = await p.locator('a[href*="/product/"]').first().getAttribute("href");
  const pages = { product: href, catalog: `/store/${s}/catalog`, "catalog-cat": `/store/${s}/catalog?category=retro`, cart: `/store/${s}/cart` };
  for (const [name, path] of Object.entries(pages)) for (const [w, n] of [[1280, "d"], [390, "m"]]) {
    await p.setViewportSize({ width: w, height: 900 });
    const r = await p.goto(B + path, { waitUntil: "networkidle" });
    await p.screenshot({ path: `${out}/${s}-${name}-${n}.png`, fullPage: true });
    console.log(s, name, n, r?.status(), await p.evaluate(() => document.documentElement.scrollHeight));
  }
}
await b.close();
