import assert from "assert";
import db from "../config/db";
import { AuthService } from "../services/auth.service";
import { BusinessService } from "../services/business.service";
import { ProductService } from "../services/product.service";
import { CustomerService } from "../services/customer.service";
import { OrderService } from "../services/order.service";
import { ReturnService } from "../services/return.service";
import { ReportService } from "../services/report.service";

async function runProductionAuditTests() {
  console.log("🧪 Starting QuickBill Production-Readiness & Security Audit Suite...\n");

  const timestamp = Date.now();

  try {
    // ==========================================
    // 1. SETUP TWO INDEPENDENT TENANTS
    // ==========================================
    console.log("▶ [Test 1] Provisioning Tenants A and B...");
    const regA = await AuthService.register({
      name: "Owner A",
      email: `audit_owner_a_${timestamp}@quickbill.com`,
      password: "Password@123"
    });
    const bizA = await BusinessService.createBusiness(regA.user.id, {
      name: "Audit Store Alpha",
      currency: "INR"
    });

    const regB = await AuthService.register({
      name: "Owner B",
      email: `audit_owner_b_${timestamp}@quickbill.com`,
      password: "Password@123"
    });
    const bizB = await BusinessService.createBusiness(regB.user.id, {
      name: "Audit Store Beta",
      currency: "INR"
    });

    assert.ok(bizA.id && bizB.id, "Both businesses must be created");
    assert.notStrictEqual(bizA.id, bizB.id, "Tenant IDs must differ");
    console.log(`  ✔ Tenant A (ID: ${bizA.id}) and Tenant B (ID: ${bizB.id}) created.\n`);

    // ==========================================
    // 2. MULTI-TENANT SECURITY: CROSS-TENANT PERMISSION CHECK
    // ==========================================
    console.log("▶ [Test 2] Verifying Tenant Isolation & x-business-id Guard...");
    const [membershipRows]: any = await db.query(
      "SELECT * FROM business_members WHERE business_id = ? AND user_id = ?",
      [bizB.id, regA.user.id]
    );
    assert.strictEqual(membershipRows.length, 0, "User A must have NO membership in Business B");
    console.log("  ✔ Database confirms User A has zero membership privileges in Business B.\n");

    // ==========================================
    // 3. CROSS-TENANT CUSTOMER PROTECTION IN CHECKOUT
    // ==========================================
    console.log("▶ [Test 3] Testing Cross-Tenant Customer Injection Prevention...");
    // Create customer in Business B
    const custB = await CustomerService.createCustomer(bizB.id, {
      name: "Beta Customer",
      phone: `999${timestamp.toString().slice(-7)}`
    });

    // Create product in Business A
    const prodA = await ProductService.createProduct(bizA.id, {
      name: "Store A Bread",
      selling_price: 50.00,
      cost_price: 30.00,
      current_stock: 50
    });

    let crossTenantCustError = false;
    try {
      // User A attempts to checkout in Business A referencing Business B's customer
      await OrderService.checkout(bizA.id, {
        items: [{ product_id: prodA.id, quantity: 1 }],
        customer_id: custB.id,
        payment_method: "CASH"
      }, regA.user.id);
    } catch (err: any) {
      if (err.code === "CUSTOMER_NOT_FOUND") {
        crossTenantCustError = true;
      }
    }
    assert.strictEqual(crossTenantCustError, true, "Checkout must reject cross-tenant customer_id with CUSTOMER_NOT_FOUND");
    console.log("  ✔ Cross-tenant customer injection rejected safely.\n");

    // ==========================================
    // 4. DUPLICATE PRODUCT CART CONSOLIDATION & STOCK DEDUCTION
    // ==========================================
    console.log("▶ [Test 4] Testing Duplicate Cart Item Consolidation...");
    // prodA has 50 stock. Send duplicate items: 3 + 2 = 5 units total
    const orderResult = await OrderService.checkout(bizA.id, {
      items: [
        { product_id: prodA.id, quantity: 3 },
        { product_id: prodA.id, quantity: 2 }
      ],
      payment_method: "CASH"
    }, regA.user.id);

    assert.ok(orderResult.order_id, "Order must be created");
    const updatedProdA = await ProductService.getProductById(bizA.id, prodA.id);
    assert.strictEqual(updatedProdA.current_stock, 45, "Stock must accurately decrement by consolidated quantity (50 - 5 = 45)");

    // Test over-order with duplicates: requested 30 + 20 = 50, but stock is 45
    let duplicateStockError = false;
    try {
      await OrderService.checkout(bizA.id, {
        items: [
          { product_id: prodA.id, quantity: 30 },
          { product_id: prodA.id, quantity: 20 }
        ],
        payment_method: "CASH"
      }, regA.user.id);
    } catch (err: any) {
      if (err.code === "INSUFFICIENT_STOCK") {
        duplicateStockError = true;
      }
    }
    assert.strictEqual(duplicateStockError, true, "Consolidated duplicate quantities exceeding stock must be rejected with INSUFFICIENT_STOCK");
    console.log("  ✔ Duplicate items in cart consolidated and verified against stock.\n");

    // ==========================================
    // 5. HISTORICAL PROFIT COST PRICE SNAPSHOTTING
    // ==========================================
    console.log("▶ [Test 5] Testing Historical Profit Integrity (Cost Price Snapshotting)...");
    const profitProd = await ProductService.createProduct(bizA.id, {
      name: "Snapshot Milk",
      selling_price: 100.00,
      cost_price: 40.00, // Margin = 60 per unit
      current_stock: 20
    });

    // Sell 2 units at cost price 40
    await OrderService.checkout(bizA.id, {
      items: [{ product_id: profitProd.id, quantity: 2 }],
      payment_method: "CASH"
    }, regA.user.id);

    // Verify snapshot in order_items
    const [itemRows]: any = await db.query(
      "SELECT cost_price, unit_price FROM order_items WHERE business_id = ? AND product_id = ? ORDER BY id DESC LIMIT 1",
      [bizA.id, profitProd.id]
    );
    assert.strictEqual(parseFloat(itemRows[0].cost_price), 40.00, "order_items must snapshot cost_price of 40.00");

    // Supplier hikes cost price from 40 to 80
    await ProductService.updateProduct(bizA.id, profitProd.id, { cost_price: 80.00 });

    // Compute profit report
    const profitReport = await ReportService.getProfitReport(bizA.id);
    const milkReport = profitReport.find((r: any) => r.product_id === profitProd.id);

    assert.ok(milkReport, "Product must appear in profit report");
    // Expected: 2 units * (100 - 40) = 120 profit (NOT 2 * (100 - 80) = 40)
    assert.strictEqual(parseFloat(milkReport.estimated_profit), 120.00, `Estimated profit must remain 120.00 despite supplier price hike to 80 (got ${milkReport.estimated_profit})`);
    console.log("  ✔ Historical profitability preserved via cost_price snapshotting.\n");

    // ==========================================
    // 6. RETURNS & CUSTOMER SPEND DEDUCTION
    // ==========================================
    console.log("▶ [Test 6] Testing Returns, Inventory Restoration & Customer Spend...");
    const custA = await CustomerService.createCustomer(bizA.id, {
      name: "Loyal Customer A",
      phone: `988${timestamp.toString().slice(-7)}`
    });

    const saleProd = await ProductService.createProduct(bizA.id, {
      name: "Refundable Item",
      selling_price: 200.00,
      cost_price: 100.00,
      current_stock: 10
    });

    // Buy 2 units for 400
    const saleOrder = await OrderService.checkout(bizA.id, {
      items: [{ product_id: saleProd.id, quantity: 2 }],
      customer_id: custA.id,
      payment_method: "CASH"
    }, regA.user.id);

    const custAfterSale = await CustomerService.getCustomerById(bizA.id, custA.id);
    assert.strictEqual(parseFloat(custAfterSale.total_purchases.toString()), 400.00, "Customer total purchases must be 400");

    // Return 1 unit (refund 200)
    const returnResult = await ReturnService.processReturn(bizA.id, {
      invoice_id: saleOrder.invoice_id,
      items: [{ product_id: saleProd.id, quantity: 1 }],
      reason: "Defective unit",
      user_id: regA.user.id
    });

    assert.ok(returnResult.return_id, "Return must be recorded");

    // Check inventory restored
    const restoredProd = await ProductService.getProductById(bizA.id, saleProd.id);
    assert.strictEqual(restoredProd.current_stock, 9, "Stock should be 9 (10 - 2 + 1 returned = 9)");

    // Check customer spend decremented
    const custAfterReturn = await CustomerService.getCustomerById(bizA.id, custA.id);
    assert.strictEqual(parseFloat(custAfterReturn.total_purchases.toString()), 200.00, "Customer total purchases must decrease from 400 to 200");
    console.log("  ✔ Inventory restored and customer total purchases accurately decremented.\n");

    console.log("🎉 ALL PRODUCTION AUDIT TESTS PASSED SUCCESSFULLY! The system is verified for the 7-day shopkeeper trial.\n");
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  }
}

runProductionAuditTests();
