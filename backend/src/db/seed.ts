import bcrypt from "bcrypt";
import db from "../config/db";
import { AuthService } from "../services/auth.service";
import { BusinessService } from "../services/business.service";
import { ProductService } from "../services/product.service";
import { CustomerService } from "../services/customer.service";
import { OrderService } from "../services/order.service";
import { EmployeeService } from "../services/employee.service";
import { ExpenseService } from "../services/expense.service";

export async function runSeed() {
  console.log("🌱 Seeding QuickBill database with demo retail data...");

  // 1. Create or Find Demo Owner
  let ownerUser: any;
  const [existingUser]: any = await db.query(
    "SELECT id, name, email FROM users WHERE email = 'demo@quickbill.com' LIMIT 1"
  );

  if (existingUser.length > 0) {
    ownerUser = existingUser[0];
    console.log("Found existing demo user:", ownerUser.email);
  } else {
    const regResult = await AuthService.register({
      name: "Nikhil Singh",
      email: "demo@quickbill.com",
      password: "Password@123",
      phone: "9876543210"
    });
    ownerUser = regResult.user;
    console.log("Created demo user:", ownerUser.email);
  }

  // 2. Create or Find Demo Business
  let business: any;
  const [existingBiz]: any = await db.query(
    "SELECT * FROM businesses WHERE owner_id = ? LIMIT 1",
    [ownerUser.id]
  );

  if (existingBiz.length > 0) {
    business = existingBiz[0];
    console.log("Found existing business:", business.name);
  } else {
    business = await BusinessService.createBusiness(ownerUser.id, {
      name: "QuickBill Mart & Retail",
      business_type: "Grocery & FMCG",
      phone: "9876543210",
      email: "contact@quickbillmart.com",
      address: "Shop 12, Connaught Place",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      gstin: "07AAAAA0000A1Z5",
      currency: "INR",
      invoice_prefix: "QB",
      tax_percentage: 18.00
    });
    console.log("Created demo business:", business.name, "ID:", business.id);
  }

  const businessId = business.id;

  // 3. Create Sample Products if none exist
  const existingProds = await ProductService.getProducts(businessId, { limit: 10 });
  if (existingProds.products.length === 0) {
    console.log("Adding sample retail products...");

    const sampleProducts = [
      {
        name: "Amul Gold Full Cream Milk 500ml",
        sku: "AMUL-MILK-500",
        barcode: "8901262010011",
        brand: "Amul",
        description: "Pasteurised fresh full cream cow & buffalo milk.",
        cost_price: 30.00,
        selling_price: 34.00,
        tax_rate: 0,
        current_stock: 45,
        min_stock_level: 10,
        unit: "pouch"
      },
      {
        name: "Britannia 100% Whole Wheat Bread 400g",
        sku: "BRIT-WHEAT-400",
        barcode: "8901063012015",
        brand: "Britannia",
        description: "Soft & healthy brown wheat bread.",
        cost_price: 40.00,
        selling_price: 50.00,
        tax_rate: 0,
        current_stock: 18,
        min_stock_level: 8,
        unit: "pack"
      },
      {
        name: "Tata Tea Gold 250g",
        sku: "TATA-TEA-250",
        barcode: "8901052002157",
        brand: "Tata",
        description: "Rich aroma blended CTC leaf tea.",
        cost_price: 120.00,
        selling_price: 150.00,
        tax_rate: 5,
        current_stock: 3, // LOW STOCK ALERT
        min_stock_level: 10,
        unit: "box"
      },
      {
        name: "Nescafe Classic Coffee 100g Jar",
        sku: "NES-COF-100",
        barcode: "8901058852305",
        brand: "Nestle",
        description: "100% pure natural instant coffee.",
        cost_price: 260.00,
        selling_price: 320.00,
        tax_rate: 18,
        current_stock: 22,
        min_stock_level: 5,
        unit: "jar"
      },
      {
        name: "Aashirvaad Shudh Chakki Atta 5kg",
        sku: "AASH-ATTA-5KG",
        barcode: "8901725181227",
        brand: "ITC",
        description: "100% whole wheat grain flour.",
        cost_price: 210.00,
        selling_price: 265.00,
        tax_rate: 0,
        current_stock: 2, // LOW STOCK ALERT
        min_stock_level: 6,
        unit: "bag"
      },
      {
        name: "Fortune Sunlite Refined Sunflower Oil 1L",
        sku: "FORT-OIL-1L",
        barcode: "8906007280145",
        brand: "Fortune",
        description: "Healthy light cooking oil with Vitamin E.",
        cost_price: 125.00,
        selling_price: 155.00,
        tax_rate: 5,
        current_stock: 35,
        min_stock_level: 10,
        unit: "bottle"
      },
      {
        name: "Cadbury Dairy Milk Silk 150g",
        sku: "CAD-SILK-150",
        barcode: "7622201732014",
        brand: "Cadbury",
        description: "Smoother, creamier milk chocolate bar.",
        cost_price: 130.00,
        selling_price: 175.00,
        tax_rate: 18,
        current_stock: 40,
        min_stock_level: 15,
        unit: "bar"
      },
      {
        name: "Lays India's Magic Masala 50g",
        sku: "LAYS-MAS-50",
        barcode: "8901491101830",
        brand: "Lays",
        description: "Crispy potato chips with spicy Indian masala seasoning.",
        cost_price: 15.00,
        selling_price: 20.00,
        tax_rate: 12,
        current_stock: 60,
        min_stock_level: 20,
        unit: "pack"
      }
    ];

    for (const prod of sampleProducts) {
      await ProductService.createProduct(businessId, {
        ...prod,
        user_id: ownerUser.id
      });
    }
  }

  // 4. Create Sample Customers
  let customer1 = await CustomerService.createCustomer(businessId, {
    name: "Rohan Sharma",
    phone: "9811223344",
    email: "rohan@example.com",
    address: "Block B, Greater Kailash, New Delhi"
  });

  let customer2 = await CustomerService.createCustomer(businessId, {
    name: "Pooja Verma",
    phone: "9822334455",
    email: "pooja@example.com",
    address: "Saket, New Delhi"
  });

  // 5. Create Sample Orders / Invoices if none exist
  const existingOrders = await OrderService.getOrders(businessId, { limit: 5 });
  if (existingOrders.orders.length === 0) {
    console.log("Generating initial POS orders & invoices...");
    const productsRes = await ProductService.getProducts(businessId, { limit: 10 });
    const pList = productsRes.products;

    if (pList.length >= 3) {
      // Order 1: Rohan Sharma (Cash)
      await OrderService.checkout(
        businessId,
        {
          customer_id: customer1.id,
          customer_name: customer1.name,
          customer_phone: customer1.phone,
          items: [
            { product_id: pList[0].id, quantity: 2 },
            { product_id: pList[1].id, quantity: 1 }
          ],
          payment_method: "CASH",
          payment_status: "PAID",
          notes: "Counter sale"
        },
        ownerUser.id
      );

      // Order 2: Pooja Verma (UPI)
      await OrderService.checkout(
        businessId,
        {
          customer_id: customer2.id,
          customer_name: customer2.name,
          customer_phone: customer2.phone,
          items: [
            { product_id: pList[3].id, quantity: 1 },
            { product_id: pList[6].id, quantity: 2 }
          ],
          cart_discount: 20,
          payment_method: "UPI",
          payment_status: "PAID",
          notes: "PhonePe UPI Transaction"
        },
        ownerUser.id
      );
    }
  }

  // 6. Create Demo Cashier Employee if not exists
  const existingEmployees = await EmployeeService.getEmployees(businessId);
  if (existingEmployees.length <= 1) {
    console.log("Adding demo cashier employee...");
    try {
      await EmployeeService.addEmployee(businessId, {
        name: "Rahul Kumar",
        email: "cashier@quickbill.com",
        password: "Password@123",
        phone: "9810101010",
        role: "CASHIER"
      });
    } catch (e) {}
  }

  // 7. Add sample expenses
  const existingExpenses = await ExpenseService.getExpenses(businessId);
  if (existingExpenses.expenses.length === 0) {
    console.log("Adding sample store expenses...");
    await ExpenseService.createExpense(businessId, {
      title: "Store Rent - Current Month",
      category: "Rent",
      amount: 18000,
      expense_date: new Date().toISOString().split("T")[0],
      notes: "Shop space monthly rent",
      user_id: ownerUser.id
    });

    await ExpenseService.createExpense(businessId, {
      title: "Electricity Bill",
      category: "Electricity",
      amount: 3450,
      expense_date: new Date().toISOString().split("T")[0],
      notes: "Commercial power bill",
      user_id: ownerUser.id
    });
  }

  console.log("✅ QuickBill database seeded successfully!");
  console.log("-----------------------------------------------");
  console.log("Demo Credentials:");
  console.log("  Owner:   demo@quickbill.com / Password@123");
  console.log("  Cashier: cashier@quickbill.com / Password@123");
  console.log("-----------------------------------------------");
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch(err => {
      console.error("Seed error:", err);
      process.exit(1);
    });
}
