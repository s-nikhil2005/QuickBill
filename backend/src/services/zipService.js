const archiver = require("archiver");
const pdfService = require("./pdfServices");
const BillingModel = require("../models/billing");

exports.generateInvoicesZIP = async (invoices, res) => {
  const archive = archiver("zip", { zlib: { level: 9 } });

  res.set({
    "Content-Type": "application/zip",
    "Content-Disposition": "attachment; filename=invoices.zip"
  });

  archive.pipe(res);

  for (const inv of invoices) {
    const items = await BillingModel.getInvoiceItems(inv.id);
    const pdfBuffer = await pdfService.generateInvoicePDF(inv, items);

    archive.append(pdfBuffer, { name: `invoice-${inv.id}.pdf` });
  }

  archive.finalize();
};
