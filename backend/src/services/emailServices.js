const nodemailer = require("nodemailer");

exports.sendInvoiceEmail = async (to, pdfBuffer, invoiceId) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"QuickBill" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your Invoice ${invoiceId}`,
    text: `Please find your invoice attached.`,
    attachments: [
      {
        filename: `invoice-${invoiceId}.pdf`,
        content: pdfBuffer
      }
    ]
  });
};
