import db from "../config/db";
import { ICheckoutInput } from "../types";

export class OrderService {
  static async checkout(businessId: number, input: ICheckoutInput, userId?: number, storeId?: number | null) {
    if (!input.items || input.items.length === 0) {
      throw { statusCode: 400, message: "Cart cannot be empty. Please add items to checkout.", code: "EMPTY_CART" };
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Fetch business settings for invoice prefix & numbers
      const [settingsRows]: any = await connection.query(
        "SELECT invoice_prefix, invoice_start_number, tax_percentage FROM settings WHERE business_id = ? LIMIT 1",
        [businessId]
      );
      const settings = settingsRows[0] || { invoice_prefix: "QB", invoice_start_number: 1001, tax_percentage: 18.00 };

      // 2. Count existing invoices for sequence
      const [invCountRows]: any = await connection.query(
        "SELECT COUNT(*) as count FROM invoices WHERE business_id = ?",
        [businessId]
      );
      const invoiceSequence = (settings.invoice_start_number || 1001) + invCountRows[0].count;
      const invoiceNumber = `${settings.invoice_prefix || "QB"}-${invoiceSequence}`;
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${invCountRows[0].count + 1}`;

      // 3. Consolidate duplicate products in cart and validate identifiers
      const consolidatedMap = new Map<number, { product_id: number; quantity: number; discount_amount?: number }>();
      for (const it of input.items) {
        if (!it.product_id || it.product_id <= 0) {
          throw { statusCode: 400, message: "Invalid product identifier in cart.", code: "INVALID_PRODUCT_ID" };
        }
        if (!it.quantity || it.quantity <= 0) {
          throw { statusCode: 400, message: "Quantity for each product must be greater than 0.", code: "INVALID_QUANTITY" };
        }
        if (consolidatedMap.has(it.product_id)) {
          const existing = consolidatedMap.get(it.product_id)!;
          existing.quantity += it.quantity;
          if (it.discount_amount !== undefined) {
            existing.discount_amount = (existing.discount_amount || 0) + (it.discount_amount || 0);
          }
        } else {
          consolidatedMap.set(it.product_id, { ...it });
        }
      }
      const consolidatedItems = Array.from(consolidatedMap.values());
      const productIds = consolidatedItems.map(i => i.product_id);

      // Lock products with SELECT ... FOR UPDATE
      const [productRows]: any = await connection.query(
        `SELECT id, name, sku, barcode, cost_price, selling_price, tax_rate, discount, current_stock, min_stock_level, is_active
         FROM products
         WHERE business_id = ? AND id IN (?) AND is_active = 1
         FOR UPDATE`,
        [businessId, productIds]
      );

      const productMap = new Map<number, any>();
      for (const p of productRows) {
        productMap.set(p.id, p);
      }

      // 4. Server-Side Calculations & Inventory Verification
      let subtotal = 0;
      let taxTotal = 0;
      let itemsDiscountTotal = 0;
      const processedItems: any[] = [];

      for (const item of consolidatedItems) {
        const product = productMap.get(item.product_id);
        if (!product) {
          throw { statusCode: 404, message: `Product ID ${item.product_id} not found in this business.`, code: "PRODUCT_NOT_FOUND" };
        }

        if (product.current_stock < item.quantity) {
          throw {
            statusCode: 400,
            message: `Insufficient stock for "${product.name}". Available: ${product.current_stock}, Requested: ${item.quantity}.`,
            code: "INSUFFICIENT_STOCK"
          };
        }

        const unitPrice = parseFloat(String(product.selling_price)) || 0;
        const costPrice = parseFloat(String(product.cost_price || 0)) || 0;
        const itemSubtotal = Math.round(unitPrice * item.quantity * 100) / 100;
        const rawDiscount = item.discount_amount !== undefined ? item.discount_amount : ((product.discount || 0) * item.quantity);
        const itemDiscount = Math.round(Math.max(0, parseFloat(String(rawDiscount)) || 0) * 100) / 100;
        const taxableAmount = Math.max(0, itemSubtotal - itemDiscount);
        const taxRate = parseFloat(String(product.tax_rate || 0)) || 0;
        const taxAmount = Math.round(((taxableAmount * taxRate) / 100) * 100) / 100;
        const itemTotalPrice = Math.round((taxableAmount + taxAmount) * 100) / 100;

        subtotal += itemSubtotal;
        itemsDiscountTotal += itemDiscount;
        taxTotal += taxAmount;

        processedItems.push({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unit_price: unitPrice,
          cost_price: costPrice,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          discount_amount: itemDiscount,
          total_price: itemTotalPrice,
          current_stock_before: product.current_stock,
          new_stock: product.current_stock - item.quantity
        });
      }

      // Apply cart-level discount if any
      const cartDiscount = Math.max(0, parseFloat(String(input.cart_discount || 0)) || 0);
      const totalDiscount = Math.round((itemsDiscountTotal + cartDiscount) * 100) / 100;
      subtotal = Math.round(subtotal * 100) / 100;
      taxTotal = Math.round(taxTotal * 100) / 100;
      const grandTotal = Math.max(0, Math.round((subtotal + taxTotal - totalDiscount) * 100) / 100);

      // 5. Handle Customer & Cross-Tenant Verification
      let customerId: number | null = input.customer_id || null;
      let customerName: string = input.customer_name?.trim() || "Walk-in Customer";
      let customerPhone: string | null = input.customer_phone?.trim() || null;

      if (customerId) {
        // Strict cross-tenant customer validation
        const [custRows]: any = await connection.query(
          "SELECT id, name, phone FROM customers WHERE business_id = ? AND id = ? LIMIT 1",
          [businessId, customerId]
        );
        if (!custRows || custRows.length === 0) {
          throw { statusCode: 404, message: "Customer not found in this business.", code: "CUSTOMER_NOT_FOUND" };
        }
        if (!input.customer_name) customerName = custRows[0].name;
        if (!input.customer_phone) customerPhone = custRows[0].phone;
      } else if (customerPhone) {
        // Find or create customer
        const [custRows]: any = await connection.query(
          "SELECT id, name FROM customers WHERE business_id = ? AND phone = ? LIMIT 1",
          [businessId, customerPhone]
        );
        if (custRows.length > 0) {
          customerId = custRows[0].id;
          if (!input.customer_name) customerName = custRows[0].name;
        } else {
          const [newCust]: any = await connection.query(
            "INSERT INTO customers (business_id, name, phone) VALUES (?, ?, ?)",
            [businessId, customerName, customerPhone]
          );
          customerId = newCust.insertId;
        }
      }

      // 6. Insert Order
      const [orderResult]: any = await connection.query(
        `INSERT INTO orders 
         (order_number, business_id, store_id, customer_id, subtotal, tax_total, discount_total, grand_total, payment_method, payment_status, status, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?)`,
        [
          orderNumber,
          businessId,
          storeId || null,
          customerId,
          subtotal,
          taxTotal,
          totalDiscount,
          grandTotal,
          input.payment_method,
          input.payment_status || "PAID",
          input.notes || null,
          userId || null
        ]
      );
      const orderId = orderResult.insertId;

      // 7. Insert Order Items & Deduct Inventory
      for (const item of processedItems) {
        // Insert order item with cost_price snapshot
        await connection.query(
          `INSERT INTO order_items 
           (order_id, business_id, product_id, product_name, sku, quantity, unit_price, cost_price, tax_rate, tax_amount, discount_amount, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            businessId,
            item.product_id,
            item.product_name,
            item.sku,
            item.quantity,
            item.unit_price,
            item.cost_price,
            item.tax_rate,
            item.tax_amount,
            item.discount_amount,
            item.total_price
          ]
        );

        // Deduct product stock
        await connection.query(
          "UPDATE products SET current_stock = ? WHERE business_id = ? AND id = ?",
          [item.new_stock, businessId, item.product_id]
        );

        // Log inventory movement
        await connection.query(
          `INSERT INTO inventory_movements 
           (business_id, store_id, product_id, type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, created_by)
           VALUES (?, ?, ?, 'SALE', ?, ?, ?, 'ORDER', ?, ?, ?)`,
          [
            businessId,
            storeId || null,
            item.product_id,
            -item.quantity,
            item.current_stock_before,
            item.new_stock,
            orderNumber,
            `Order #${orderNumber}`,
            userId || null
          ]
        );
      }

      // 8. Insert Invoice
      const [invResult]: any = await connection.query(
        `INSERT INTO invoices 
         (invoice_number, business_id, store_id, order_id, customer_id, customer_name, customer_phone, subtotal, tax_total, discount_total, grand_total, payment_method, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceNumber,
          businessId,
          storeId || null,
          orderId,
          customerId,
          customerName,
          customerPhone,
          subtotal,
          taxTotal,
          totalDiscount,
          grandTotal,
          input.payment_method,
          input.payment_status || "PAID"
        ]
      );
      const invoiceId = invResult.insertId;

      // 9. Update Customer metrics if linked
      if (customerId) {
        await connection.query(
          `UPDATE customers 
           SET total_purchases = total_purchases + ?, 
               order_count = order_count + 1, 
               last_purchase_date = NOW()
           WHERE business_id = ? AND id = ?`,
          [grandTotal, businessId, customerId]
        );
      }

      // 10. Audit Log
      await connection.query(
        `INSERT INTO audit_logs (business_id, user_id, action, entity_type, entity_id, metadata)
         VALUES (?, ?, 'ORDER_CREATED', 'ORDER', ?, ?)`,
        [
          businessId,
          userId || null,
          orderId.toString(),
          JSON.stringify({ order_number: orderNumber, invoice_number: invoiceNumber, grand_total: grandTotal })
        ]
      );

      // COMMIT TRANSACTION
      await connection.commit();

      return {
        success: true,
        order_id: orderId,
        order_number: orderNumber,
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        grand_total: grandTotal,
        subtotal,
        tax_total: taxTotal,
        discount_total: totalDiscount,
        payment_method: input.payment_method,
        payment_status: input.payment_status || "PAID",
        customer: { id: customerId, name: customerName, phone: customerPhone },
        items: processedItems
      };
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  static async getOrders(businessId: number, options: {
    page?: number;
    limit?: number;
    search?: string;
    payment_status?: string;
  } = {}) {
    const page = options.page && options.page > 0 ? options.page : 1;
    const limit = options.limit && options.limit > 0 ? options.limit : 50;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT o.*, i.invoice_number, u.name AS created_by_name
      FROM orders o
      LEFT JOIN invoices i ON i.order_id = o.id
      LEFT JOIN users u ON u.id = o.created_by
      WHERE o.business_id = ?
    `;
    const params: any[] = [businessId];

    if (options.search) {
      sql += " AND (o.order_number LIKE ? OR i.invoice_number LIKE ?)";
      const term = `%${options.search.trim()}%`;
      params.push(term, term);
    }

    if (options.payment_status) {
      sql += " AND o.payment_status = ?";
      params.push(options.payment_status);
    }

    const countSql = sql.replace("SELECT o.*, i.invoice_number, u.name AS created_by_name", "SELECT COUNT(*) as total");
    const [countRows]: any = await db.query(countSql, params);
    const total = countRows[0].total;

    sql += " ORDER BY o.id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows]: any = await db.query(sql, params);

    return {
      orders: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getOrderDetails(businessId: number, orderId: number) {
    const [orders]: any = await db.query(
      `SELECT o.*, i.invoice_number, i.id AS invoice_id, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, u.name AS cashier_name
       FROM orders o
       LEFT JOIN invoices i ON i.order_id = o.id
       LEFT JOIN customers c ON c.id = o.customer_id
       LEFT JOIN users u ON u.id = o.created_by
       WHERE o.business_id = ? AND o.id = ? LIMIT 1`,
      [businessId, orderId]
    );

    if (!orders || orders.length === 0) {
      throw { statusCode: 404, message: "Order not found", code: "ORDER_NOT_FOUND" };
    }

    const order = orders[0];

    const [items]: any = await db.query(
      "SELECT * FROM order_items WHERE business_id = ? AND order_id = ?",
      [businessId, orderId]
    );

    return { ...order, items };
  }
}
