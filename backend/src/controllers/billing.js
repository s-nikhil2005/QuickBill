const BillingModel = require("../models/billing");
const ProductModel = require("../models/product");
const Notifications = require("../services/notificationService");
const pdfService = require("../services/pdfServices");
const emailService = require("../services/emailServices");
const summaryPdfService = require("../services/summaryPdfService");
const zipService = require("../services/zipService");

exports.createInvoice = async (req, res) => {
  try {
    const { customer_name, customer_phone, payment_method } = req.body;

    const invoiceId = await BillingModel.createInvoice({
      customer_name,
      customer_phone,
      payment_method,
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0
    });

    res.status(201).json({
      message: "Invoice created",
      invoice_id: invoiceId
    });

  } catch (err) {
    res.status(500).json({ message: "Error creating invoice", error: err.message });
  }
};

exports.addItemToInvoice = async (req, res) => {
  try {
    const { invoice_id, product_id, quantity } = req.body;

    const product = await ProductModel.getProductById(product_id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.stock < quantity)
      return res.status(400).json({ message: "Not enough stock available" });

    const totalPrice = product.price * quantity;

    await BillingModel.addItem({
      invoice_id,
      product_id,
      quantity,
      price: product.price,
      total: totalPrice
    });

    res.status(200).json({
      message: "Item added successfully",
      product_price: product.price,
      total_item_price: totalPrice
    });

  } catch (err) {
    res.status(500).json({ message: "Error adding item", error: err.message });
  }
};

exports.finalizeInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;
    const { tax = 0, discount = 0 } = req.body;

    // 1️⃣ Fetch invoice items
    const items = await BillingModel.getInvoiceItems(invoiceId);
    if (items.length === 0) {
      return res.status(400).json({ message: "No items in invoice" });
    }

    // 2️⃣ Calculate totals
    let subtotal = 0;
    items.forEach(item => subtotal += item.total);

    const total = subtotal + tax - discount;

    // 3️⃣ Update invoice totals in DB
    await BillingModel.updateInvoiceTotals(invoiceId, {
      subtotal,
      tax,
      discount,
      total
    });

    // 4️⃣ Reduce stock for each item
    for (let item of items) {
      await ProductModel.updateStock(item.product_id, item.quantity * -1);
    }

    // 5️⃣ Fetch final invoice data
    const invoice = await BillingModel.getInvoice(invoiceId);
    const phone = invoice.customer_phone;
    const email = invoice.customer_email;  // optional field

    // 6️⃣ Create WhatsApp / SMS text message
    const message = `
🧾 *Your QuickBill Invoice*
--------------------------------
Invoice ID: ${invoiceId}
Customer: ${invoice.customer_name}
Subtotal: ₹${subtotal}
Tax: ₹${tax}
Discount: ₹${discount}
--------------------------------
*Total Payable: ₹${total}*
Payment: ${invoice.payment_method}
--------------------------------
Thank you for shopping with us!
    `;

    // 7️⃣ Generate PDF invoice
    const pdfBuffer = await pdfService.generateInvoicePDF(invoice, items);

    // 8️⃣ Email invoice (if customer email exists)
    let emailStatus = null;

    if (email) {
      try {
        await emailService.sendInvoiceEmail(email, pdfBuffer, invoiceId);
        emailStatus = "Email sent";
      } catch (e) {
        emailStatus = "Email failed: " + e.message;
      }
    }

    // 9️⃣ Try WhatsApp first
    const waResponse = await Notifications.sendWhatsApp(phone, message);

    if (!waResponse.success) {
      console.log("WhatsApp failed:", waResponse.error);

      // 🔥 10️⃣ Try SMS fallback
      const smsResponse = await Notifications.sendSMS(phone, message);

      if (!smsResponse.success) {
        return res.status(200).json({
          message: "Invoice finalized (but sending failed)",
          invoice_id: invoiceId,
          subtotal,
          tax,
          discount,
          total,
          whatsapp_error: waResponse.error,
          sms_error: smsResponse.error,
          emailStatus
        });
      }

      // SMS success
      return res.status(200).json({
        message: "Invoice finalized & SMS sent",
        invoice_id: invoiceId,
        subtotal,
        tax,
        discount,
        total,
        emailStatus
      });
    }

    // 11️⃣ Final success — WhatsApp delivered
    return res.status(200).json({
      message: "Invoice finalized & WhatsApp sent",
      invoice_id: invoiceId,
      subtotal,
      tax,
      discount,
      total,
      emailStatus
    });

  } catch (err) {
    res.status(500).json({
      message: "Checkout failed",
      error: err.message
    });
  }
};

exports.getInvoiceDetails = async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;

    const invoice = await BillingModel.getInvoice(invoiceId);
    const items = await BillingModel.getInvoiceItems(invoiceId);

    res.status(200).json({ invoice, items });

  } catch (err) {
    res.status(500).json({ message: "Error fetching invoice", error: err.message });
  }
};

exports.getInvoicePDF = async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;

    const invoice = await BillingModel.getInvoice(invoiceId);
    const items = await BillingModel.getInvoiceItems(invoiceId);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const pdfBuffer = await pdfService.generateInvoicePDF(invoice, items);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=invoice-${invoiceId}.pdf`,
    });

    return res.send(pdfBuffer);

  } catch (err) {
    res.status(500).json({ message: "Error generating PDF", error: err.message });
  }
};

exports.exportSummaryPDF = async (req, res) => {
  try {
    const { from, to } = req.query;

    const invoices = await BillingModel.getInvoicesBetweenDates(from, to);

    let totals = { count: 0, revenue: 0, tax: 0, discount: 0 };

    invoices.forEach(inv => {
      totals.count++;
      totals.revenue += inv.total;
      totals.tax += inv.tax;
      totals.discount += inv.discount;
    });

    const pdfBuffer = await summaryPdfService.generateSummaryPDF(from, to, invoices, totals);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=summary_${from}_to_${to}.pdf`,
    });

    res.send(pdfBuffer);

  } catch (err) {
    res.status(500).json({ message:"Error generating summary PDF", error:err.message });
  }
};

exports.exportInvoicesZIP = async (req, res) => {
  try {
    const { from, to } = req.query;

    const invoices = await BillingModel.getInvoicesBetweenDates(from, to);

    if (invoices.length === 0) {
      return res.status(404).json({ message:"No invoices found for selected range" });
    }

    await zipService.generateInvoicesZIP(invoices, res);

  } catch (err) {
    res.status(500).json({ message:"Error generating ZIP", error:err.message });
  }
};
