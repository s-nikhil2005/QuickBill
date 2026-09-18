import db from "../config/db";

export class ReturnService {
  static async processReturn(businessId: number, data: {
    invoice_id: number;
    items: { product_id: number; quantity: number }[];
    reason?: string;
    user_id?: number;
    store_id?: number | null;
  }) {
    if (!data.items || data.items.length === 0) {
      throw { statusCode: 400, message: "No items specified for return", code: "EMPTY_RETURN_ITEMS" };
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Fetch invoice & order
      const [invRows]: any = await connection.query(
        "SELECT * FROM invoices WHERE business_id = ? AND id = ? LIMIT 1",
        [businessId, data.invoice_id]
      );

      if (!invRows || invRows.length === 0) {
        throw { statusCode: 404, message: "Invoice not found", code: "INVOICE_NOT_FOUND" };
      }

      const invoice = invRows[0];

      // 2. Fetch original order items
      const [orderItems]: any = await connection.query(
        "SELECT * FROM order_items WHERE business_id = ? AND order_id = ?",
        [businessId, invoice.order_id]
      );

      const orderItemMap = new Map<number, any>();
      for (const item of orderItems) {
        orderItemMap.set(item.product_id, item);
      }

      let totalRefund = 0;
      const processedReturnItems: any[] = [];

      for (const returnItem of data.items) {
        const orderItem = orderItemMap.get(returnItem.product_id);
        if (!orderItem) {
          throw {
            statusCode: 400,
            message: `Product ID ${returnItem.product_id} was not part of this invoice.`,
            code: "PRODUCT_NOT_IN_INVOICE"
          };
        }

        if (returnItem.quantity <= 0 || returnItem.quantity > orderItem.quantity) {
          throw {
            statusCode: 400,
            message: `Invalid return quantity for "${orderItem.product_name}". Ordered: ${orderItem.quantity}, Returned: ${returnItem.quantity}`,
            code: "INVALID_RETURN_QUANTITY"
          };
        }

        const refundPerUnit = parseFloat(orderItem.total_price) / orderItem.quantity;
        const itemRefund = Math.round(refundPerUnit * returnItem.quantity * 100) / 100;
        totalRefund += itemRefund;

        // Fetch current product stock to restore
        const [prodRows]: any = await connection.query(
          "SELECT current_stock FROM products WHERE business_id = ? AND id = ? FOR UPDATE",
          [businessId, returnItem.product_id]
        );
        const currentStock = prodRows[0].current_stock;
        const newStock = currentStock + returnItem.quantity;

        // Restore stock
        await connection.query(
          "UPDATE products SET current_stock = ? WHERE business_id = ? AND id = ?",
          [newStock, businessId, returnItem.product_id]
        );

        // Record inventory movement
        await connection.query(
          `INSERT INTO inventory_movements 
           (business_id, store_id, product_id, type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, created_by)
           VALUES (?, ?, ?, 'RETURN', ?, ?, ?, 'RETURN', ?, ?, ?)`,
          [
            businessId,
            data.store_id || null,
            returnItem.product_id,
            returnItem.quantity,
            currentStock,
            newStock,
            invoice.invoice_number,
            `Return for Invoice #${invoice.invoice_number}: ${data.reason || "Customer return"}`,
            data.user_id || null
          ]
        );

        processedReturnItems.push({
          product_id: returnItem.product_id,
          product_name: orderItem.product_name,
          quantity: returnItem.quantity,
          refund_amount: itemRefund
        });
      }

      // 3. Insert Return record
      const returnNumber = `RET-${Date.now().toString().slice(-6)}`;
      const [retResult]: any = await connection.query(
        `INSERT INTO returns (return_number, business_id, store_id, order_id, invoice_id, total_refund, reason, processed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          returnNumber,
          businessId,
          data.store_id || null,
          invoice.order_id,
          invoice.id,
          totalRefund,
          data.reason || "Customer Return",
          data.user_id || null
        ]
      );
      const returnId = retResult.insertId;

      // 4. Insert Return Items
      for (const item of processedReturnItems) {
        await connection.query(
          `INSERT INTO return_items (return_id, product_id, quantity, refund_amount, restock)
           VALUES (?, ?, ?, ?, 1)`,
          [returnId, item.product_id, item.quantity, item.refund_amount]
        );
      }

      // 5. Update invoice payment status if needed
      if (totalRefund >= parseFloat(invoice.grand_total)) {
        await connection.query("UPDATE invoices SET payment_status = 'REFUNDED' WHERE id = ?", [invoice.id]);
        await connection.query("UPDATE orders SET payment_status = 'REFUNDED' WHERE id = ?", [invoice.order_id]);
      }

      // 6. Adjust Customer metrics if customer was linked
      if (invoice.customer_id) {
        await connection.query(
          "UPDATE customers SET total_purchases = GREATEST(0, total_purchases - ?) WHERE business_id = ? AND id = ?",
          [totalRefund, businessId, invoice.customer_id]
        );
      }

      // 7. Audit log
      await connection.query(
        `INSERT INTO audit_logs (business_id, user_id, action, entity_type, entity_id, metadata)
         VALUES (?, ?, 'RETURN_PROCESSED', 'RETURN', ?, ?)`,
        [
          businessId,
          data.user_id || null,
          returnId.toString(),
          JSON.stringify({ return_number: returnNumber, invoice_number: invoice.invoice_number, total_refund: totalRefund })
        ]
      );

      await connection.commit();

      return {
        success: true,
        return_id: returnId,
        return_number: returnNumber,
        invoice_number: invoice.invoice_number,
        total_refund: totalRefund,
        items: processedReturnItems
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async getReturns(businessId: number) {
    const [rows]: any = await db.query(
      `SELECT r.*, i.invoice_number, u.name AS processed_by_name
       FROM returns r
       JOIN invoices i ON i.id = r.invoice_id
       LEFT JOIN users u ON u.id = r.processed_by
       WHERE r.business_id = ?
       ORDER BY r.id DESC`,
      [businessId]
    );
    return rows;
  }

  static async getReturnDetails(businessId: number, returnId: number) {
    const [retRows]: any = await db.query(
      `SELECT r.*, i.invoice_number, u.name AS processed_by_name
       FROM returns r
       JOIN invoices i ON i.id = r.invoice_id
       LEFT JOIN users u ON u.id = r.processed_by
       WHERE r.business_id = ? AND r.id = ? LIMIT 1`,
      [businessId, returnId]
    );

    if (!retRows || retRows.length === 0) {
      throw { statusCode: 404, message: "Return record not found", code: "RETURN_NOT_FOUND" };
    }

    const [items]: any = await db.query(
      `SELECT ri.*, p.name AS product_name, p.sku AS product_sku
       FROM return_items ri
       JOIN products p ON p.id = ri.product_id
       WHERE ri.return_id = ?`,
      [returnId]
    );

    return { ...retRows[0], items };
  }
}
