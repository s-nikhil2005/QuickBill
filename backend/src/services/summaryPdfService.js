const puppeteer = require("puppeteer");
const summaryTemplate = require("../templates/summaryTemplate");

exports.generateSummaryPDF = async (from, to, invoices, totals) => {
  const browser = await puppeteer.launch({ headless: "new", args:["--no-sandbox"] });
  const page = await browser.newPage();

  const html = summaryTemplate(from, to, invoices, totals);
  await page.setContent(html);

  const buffer = await page.pdf({ format:"A4", printBackground:true });
  await browser.close();
  return buffer;
};
