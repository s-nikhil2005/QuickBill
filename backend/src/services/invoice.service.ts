import db from "../config/db";

export class InvoiceService {
  static async getInvoices(businessId: number, options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 50;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT i.*, o.order_number
      FROM invoices i
      JOIN orders o ON o.id = i.order_id
      WHERE i.business_id = ?
    `;
    const params: any[] = [businessId];

    if (options.search) {
      sql += " AND (i.invoice_number LIKE ? OR i.customer_name LIKE ? OR i.customer_phone LIKE ?)";
      const term = `%${options.search.trim()}%`;
      params.push(term, term, term);
    }

    if (options.status) {
      sql += " AND i.payment_status = ?";
      params.push(options.status);
    }

    const countSql = sql.replace("SELECT i.*, o.order_number", "SELECT COUNT(*) as total");
    const [countRows]: any = await db.query(countSql, params);
    const total = countRows[0].total;

    sql += " ORDER BY i.id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows]: any = await db.query(sql, params);

    return {
      invoices: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getInvoiceDetails(businessId: number, invoiceId: number) {
    const [invRows]: any = await db.query(
      `SELECT i.*, o.order_number, b.name AS business_name, b.phone AS business_phone, 
              b.email AS business_email, b.address AS business_address, b.city AS business_city, 
              b.state AS business_state, b.gstin AS business_gstin, b.currency, b.logo_url,
              s.footer_text, s.terms
       FROM invoices i
       JOIN orders o ON o.id = i.order_id
       JOIN businesses b ON b.id = i.business_id
       LEFT JOIN settings s ON s.business_id = b.id
       WHERE i.business_id = ? AND i.id = ? LIMIT 1`,
      [businessId, invoiceId]
    );

    if (!invRows || invRows.length === 0) {
      throw { statusCode: 404, message: "Invoice not found", code: "INVOICE_NOT_FOUND" };
    }

    const invoice = invRows[0];

    const [items]: any = await db.query(
      "SELECT * FROM order_items WHERE business_id = ? AND order_id = ?",
      [businessId, invoice.order_id]
    );

    return { ...invoice, items };
  }

  static renderInvoiceHtml(invoice: any, items: any[]): string {
    const currency = invoice.currency === "INR" ? "₹" : invoice.currency || "₹";
    const dateFormatted = new Date(invoice.created_at).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice #${invoice.invoice_number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 32px; font-size: 13px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
    .brand h1 { margin: 0 0 4px 0; font-size: 24px; color: #0f172a; }
    .brand p { margin: 2px 0; color: #64748b; font-size: 12px; }
    .inv-info { text-align: right; }
    .inv-info h2 { margin: 0 0 4px 0; font-size: 20px; color: #2563eb; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 6px; }
    .customer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-weight: 600; font-size: 12px; color: #475569; border-bottom: 1px solid #cbd5e1; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    .totals { width: 320px; margin-left: auto; margin-bottom: 30px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals-row.grand { font-size: 16px; font-weight: 700; color: #0f172a; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 4px; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; color: #64748b; font-size: 11px; }
    @media print {
      body { padding: 0; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>${invoice.business_name}</h1>
      <p>${invoice.business_address || ""}, ${invoice.business_city || ""} ${invoice.business_state || ""}</p>
      <p>Phone: ${invoice.business_phone || "N/A"} | Email: ${invoice.business_email || "N/A"}</p>
      ${invoice.business_gstin ? `<p><strong>GSTIN:</strong> ${invoice.business_gstin}</p>` : ""}
    </div>
    <div class="inv-info">
      <h2>TAX INVOICE</h2>
      <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
      <p><strong>Date:</strong> ${dateFormatted}</p>
      <p><strong>Payment:</strong> ${invoice.payment_method} (${invoice.payment_status})</p>
    </div>
  </div>

  <div class="customer-box">
    <div class="section-title">Billed To</div>
    <strong>${invoice.customer_name || "Walk-in Customer"}</strong>
    ${invoice.customer_phone ? `<div>Phone: ${invoice.customer_phone}</div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item Description</th>
        <th>SKU</th>
        <th style="text-align: right;">Qty</th>
        <th style="text-align: right;">Rate</th>
        <th style="text-align: right;">Tax</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${it.product_name}</strong></td>
          <td>${it.sku || "-"}</td>
          <td style="text-align: right;">${it.quantity}</td>
          <td style="text-align: right;">${currency}${parseFloat(it.unit_price).toFixed(2)}</td>
          <td style="text-align: right;">${currency}${parseFloat(it.tax_amount || 0).toFixed(2)}</td>
          <td style="text-align: right;"><strong>${currency}${parseFloat(it.total_price).toFixed(2)}</strong></td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${currency}${parseFloat(invoice.subtotal).toFixed(2)}</span>
    </div>
    ${parseFloat(invoice.discount_total) > 0 ? `
    <div class="totals-row" style="color: #16a34a;">
      <span>Discount:</span>
      <span>-${currency}${parseFloat(invoice.discount_total).toFixed(2)}</span>
    </div>` : ""}
    <div class="totals-row">
      <span>Tax Total:</span>
      <span>${currency}${parseFloat(invoice.tax_total).toFixed(2)}</span>
    </div>
    <div class="totals-row grand">
      <span>Total Payable:</span>
      <span>${currency}${parseFloat(invoice.grand_total).toFixed(2)}</span>
    </div>
  </div>

  <div class="footer">
    <p>${invoice.footer_text || "Thank you for shopping with us!"}</p>
    <p>${invoice.terms || ""}</p>
    <p style="color: #94a3b8; font-size: 10px;">Generated automatically via QuickBill SaaS</p>
  </div>
</body>
</html>
    `;
  }
}
