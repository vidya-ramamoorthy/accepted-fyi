/**
 * Quick script to inspect the rendered DOM of a commondatasets.fyi page
 * to understand the HTML structure for the CDS parser.
 */
import puppeteer from "puppeteer";

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://www.commondatasets.fyi/harvard", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  // Get the full rendered text content
  const textContent = await page.evaluate(() => document.body.innerText);
  console.log("=== FULL TEXT CONTENT ===");
  console.log(textContent);

  await browser.close();
}

main().catch(console.error);
