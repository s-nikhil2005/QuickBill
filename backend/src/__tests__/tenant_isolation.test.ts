import assert from "assert";
import db from "../config/db";
import { AuthService } from "../services/auth.service";
import { BusinessService } from "../services/business.service";
import { ProductService } from "../services/product.service";
import { OrderService } from "../services/order.service";

async function runTests() {
  console.log("🧪 Running QuickBill Multi-Tenancy & Transaction Safety Tests...\n");

  const connection = await db.getConnection();

  try {
    // -------------------------------------------------------------
    // TEST 1: Create Two Independent Tenants (Business A & Business B)
    // -------------------------------------------------------------
    console.log("▶ Test 1: Tenant Creation & Isolation");
    const userA = await AuthService.register({
      name: "Tenant A Owner",
      email: `tenantA_${Date.now()}@test.com`,
      password: "Password@123"
    });
    const bizA = await BusinessService.createBusiness(userA.user.id, {
      name: "Tenant A Electronics"
    });

    const userB = await AuthService.register({
      name: "Tenant B Owner",
      email: `tenantB_${Date.now()}@test.com`,
      password: "Password@123"
    });
    const bizB = await BusinessService.createBusiness(userB.user.id, {
      name: "Tenant B Bakery"
    });

    assert.notStrictEqual(bizA.id, bizB.id, "Businesses must have unique IDs");
    console.log("  ✔ Tenant A (ID: %d) and Tenant B (ID: %d) created successfully.", bizA.id, bizB.id);

    // -------------------------------------------------------------
    // TEST 2: Product Creation Scoped to Business A
    // -------------------------------------------------------------
    console.log("\n▶ Test 2: Product Scoping per Tenant");
    const prodA = await ProductService.createProduct(bizA.id, {
      name: "Sony Headphones",
      selling_price: 2500,
      cost_price: 1800,
      current_stock: 10,
      min_stock_level: 2,
      user_id: userA.user.id
    });

    // Business A should see it
    const prodsInA = await ProductService.getProducts(bizA.id);
    assert.strictEqual(prodsInA.products.some((p: any) => p.id === prodA.id), true);

    // CRITICAL: Business B MUST NEVER see Business A's product
    const prodsInB = await ProductService.getProducts(bizB.id);
    assert.strictEqual(prodsInB.products.some((p: any) => p.id === prodA.id), false);
    console.log("  ✔ Business B cannot see Business A's product.");

    // Direct lookup of Business A's product using Business B's context must fail
    let accessDenied = false;
    try {
      await ProductService.getProductById(bizB.id, prodA.id);
    } catch (err: any) {
      accessDenied = true;
      assert.strictEqual(err.code, "PRODUCT_NOT_FOUND");
    }
    assert.strictEqual(accessDenied, true, "Cross-tenant product lookup must fail");
    console.log("  ✔ Direct cross-tenant product lookup rejected with PRODUCT_NOT_FOUND.");

    // -------------------------------------------------------------
    // TEST 3: Transactional Checkout & Stock Deduction
    // -------------------------------------------------------------
    console.log("\n▶ Test 3: Transactional Checkout & Atomic Stock Deduction");
    const initialStock = prodA.current_stock;
    const checkoutQty = 3;

    const orderResult = await OrderService.checkout(
      bizA.id,
      {
        items: [{ product_id: prodA.id, quantity: checkoutQty }],
        payment_method: "CASH",
        payment_status: "PAID"
      },
      userA.user.id
    );

    assert.strictEqual(orderResult.success, true);
    assert.strictEqual(orderResult.items[0].quantity, checkoutQty);

    // Verify stock decreased atomically
    const updatedProdA = await ProductService.getProductById(bizA.id, prodA.id);
    assert.strictEqual(updatedProdA.current_stock, initialStock - checkoutQty);
    console.log("  ✔ Stock atomically decreased from %d to %d.", initialStock, updatedProdA.current_stock);

    // -------------------------------------------------------------
    // TEST 4: Insufficient Stock Protection (Rollback Verification)
    // -------------------------------------------------------------
    console.log("\n▶ Test 4: Insufficient Stock Protection");
    let stockError = false;
    try {
      await OrderService.checkout(
        bizA.id,
        {
          items: [{ product_id: prodA.id, quantity: 99999 }],
          payment_method: "CASH"
        },
        userA.user.id
      );
    } catch (err: any) {
      stockError = true;
      assert.strictEqual(err.code, "INSUFFICIENT_STOCK");
    }
    assert.strictEqual(stockError, true);

    // Ensure stock remained unchanged after rollback
    const afterFailedOrderProd = await ProductService.getProductById(bizA.id, prodA.id);
    assert.strictEqual(afterFailedOrderProd.current_stock, updatedProdA.current_stock);
    console.log("  ✔ Over-order correctly rejected with INSUFFICIENT_STOCK and rolled back.");

    // -------------------------------------------------------------
    // Clean up test data
    // -------------------------------------------------------------
    await connection.query("DELETE FROM businesses WHERE id IN (?, ?)", [bizA.id, bizB.id]);
    await connection.query("DELETE FROM users WHERE id IN (?, ?)", [userA.user.id, userB.user.id]);

    console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! Multi-tenancy isolation and transaction integrity verified.\n");
  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runTests();
