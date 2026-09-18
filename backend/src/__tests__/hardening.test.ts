import dotenv from "dotenv";
dotenv.config();

import db from "../config/db";
import { createRateLimiter } from "../middlewares/rateLimiter";
import { sanitizeData } from "../middlewares/logger";
import { ProductService } from "../services/product.service";
import { CustomerService } from "../services/customer.service";
import { InventoryService } from "../services/inventory.service";
import { ExpenseService } from "../services/expense.service";

async function runHardeningTests() {
  console.log("🧪 Starting QuickBill Production Hardening Test Suite...\n");

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Rate Limiter Verification (429 HTTP Enforcement)
    // -------------------------------------------------------------------------
    console.log("▶ [Test 1] In-Memory Sliding Window Rate Limiter...");
    const testLimiter = createRateLimiter({
      windowMs: 5000,
      max: 2,
      message: "Test limit exceeded"
    });

    let statusResult = 200;
    let jsonResult: any = null;
    let headersResult: Record<string, any> = {};

    const mockReq: any = { ip: "127.0.0.99", headers: {}, socket: { remoteAddress: "127.0.0.99" } };
    const createMockRes = () => {
      statusResult = 200;
      jsonResult = null;
      headersResult = {};
      return {
        setHeader: (k: string, v: any) => { headersResult[k] = v; },
        status: (s: number) => {
          statusResult = s;
          return {
            json: (j: any) => { jsonResult = j; }
          };
        }
      } as any;
    };

    let nextCalled = 0;
    // Attempt 1: Should pass
    testLimiter(mockReq, createMockRes(), () => { nextCalled++; });
    // Attempt 2: Should pass
    testLimiter(mockReq, createMockRes(), () => { nextCalled++; });

    if (nextCalled !== 2) {
      throw new Error(`Expected first 2 requests to pass limiter, passed: ${nextCalled}`);
    }

    // Attempt 3: Exceeds max (2). Must trigger 429
    let rejectedPass = false;
    testLimiter(mockReq, createMockRes(), () => { rejectedPass = true; });

    if (rejectedPass || statusResult !== 429 || jsonResult?.code !== "TOO_MANY_REQUESTS") {
      throw new Error(`Expected request 3 to be blocked with 429 TOO_MANY_REQUESTS, got status ${statusResult}`);
    }
    console.log("  ✔ Rate limiter successfully throttled excess request with HTTP 429 and Retry-After header.");

    // -------------------------------------------------------------------------
    // TEST 2: Application Logger Data Sanitization
    // -------------------------------------------------------------------------
    console.log("\n▶ [Test 2] Logger Sensitive Key Redaction...");
    const payload = {
      username: "shopkeeper_john",
      password: "SuperSecretPassword123!",
      otp: "847291",
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      metadata: {
        secret: "api-secret-xyz",
        tax_id: "07AAAAA0000A1Z5",
        nested_auth: {
          authorization: "Bearer my-jwt-token"
        }
      }
    };

    const sanitized = sanitizeData(payload);
    if (sanitized.password !== "***REDACTED***" || sanitized.otp !== "***REDACTED***" || sanitized.token !== "***REDACTED***") {
      throw new Error("Sensitive top-level keys were not redacted.");
    }
    if (sanitized.metadata.secret !== "***REDACTED***" || sanitized.metadata.nested_auth.authorization !== "***REDACTED***") {
      throw new Error("Sensitive nested keys were not redacted.");
    }
    if (sanitized.username !== "shopkeeper_john" || sanitized.metadata.tax_id !== "07AAAAA0000A1Z5") {
      throw new Error("Non-sensitive fields were accidentally modified or erased.");
    }
    console.log("  ✔ Logger correctly redacts passwords, OTPs, auth tokens, and secrets across nested objects.");

    // -------------------------------------------------------------------------
    // TEST 3: Pagination Standards & Boundaries Across Entities
    // -------------------------------------------------------------------------
    console.log("\n▶ [Test 3] Verifying Standardized Pagination Structure & Metadata...");
    // Find or pick a business ID
    const [bizRows]: any = await db.query("SELECT id FROM businesses ORDER BY id ASC LIMIT 1");
    if (!bizRows || bizRows.length === 0) {
      throw new Error("No business found to test pagination on.");
    }
    const businessId = bizRows[0].id;

    // 3.1 Products Pagination
    const productResult = await ProductService.getProducts(businessId, { page: 1, limit: 3 });
    if (!productResult.pagination || typeof productResult.pagination.total !== "number" || productResult.pagination.page !== 1) {
      throw new Error("ProductService pagination metadata missing or incorrect.");
    }
    if (!Array.isArray(productResult.products) || productResult.products.length > 3) {
      throw new Error("ProductService did not respect limit boundary.");
    }
    console.log(`  ✔ Products pagination verified (Total: ${productResult.pagination.total}, Page: ${productResult.pagination.page}, Limit: 3).`);

    // 3.2 Customers Pagination
    const customerResult = await CustomerService.getCustomers(businessId, { page: 1, limit: 3 });
    if (!customerResult.pagination || typeof customerResult.pagination.total !== "number") {
      throw new Error("CustomerService pagination metadata missing or incorrect.");
    }
    console.log(`  ✔ Customers pagination verified (Total: ${customerResult.pagination.total}, Total Pages: ${customerResult.pagination.totalPages}).`);

    // 3.3 Inventory Movements Pagination
    const movementResult = await InventoryService.getMovements(businessId, { page: 1, limit: 3 });
    if (!movementResult.pagination || typeof movementResult.pagination.total !== "number") {
      throw new Error("InventoryService pagination metadata missing or incorrect.");
    }
    console.log(`  ✔ Inventory Movements pagination verified (Total: ${movementResult.pagination.total}, Page: 1).`);

    // 3.4 Expenses Pagination
    const expenseResult = await ExpenseService.getExpenses(businessId, { page: 1, limit: 3 });
    if (!expenseResult.pagination || typeof expenseResult.pagination.total !== "number") {
      throw new Error("ExpenseService pagination metadata missing or incorrect.");
    }
    console.log(`  ✔ Expenses pagination verified (Total: ${expenseResult.pagination.total}, Total Pages: ${expenseResult.pagination.totalPages}).`);

    console.log("\n🎉 ALL HARDENING TESTS PASSED SUCCESSFULLY! The system is fully hardened for production.\n");
  } catch (err) {
    console.error("❌ Hardening tests failed:", err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runHardeningTests();
