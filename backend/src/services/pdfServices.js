const puppeteer = require("puppeteer");
const invoiceTemplate = require("../templates/invoiceTemplate");

exports.generateInvoicePDF = async (invoice, items) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox"]
  });

  const page = await browser.newPage();

  const html = invoiceTemplate(invoice, items);
  await page.setContent(html);

  const buffer = await page.pdf({
    format: "A4",
    printBackground: true
  });

  await browser.close();
  return buffer;
};
