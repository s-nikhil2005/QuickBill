import db from "../config/db";

export async function runMigration() {
  console.log("🚀 Starting QuickBill database migration...");

  const connection = await db.getConnection();

  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0;");

    // 1. USERS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        avatar_url VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. BUSINESSES (TENANTS)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        business_type VARCHAR(100) DEFAULT 'General Store',
        owner_id INT NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(150),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100) DEFAULT 'India',
        gstin VARCHAR(50),
        currency VARCHAR(10) DEFAULT 'INR',
        invoice_prefix VARCHAR(10) DEFAULT 'QB',
        tax_percentage DECIMAL(5,2) DEFAULT 18.00,
        logo_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_owner (owner_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. STORES / BRANCHES
    await connection.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50),
        address TEXT,
        phone VARCHAR(20),
        is_main BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_store_business (business_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. BUSINESS MEMBERS (USERS TO BUSINESS WITH ROLES)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS business_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        user_id INT NOT NULL,
        store_id INT,
        role ENUM('OWNER', 'ADMIN', 'MANAGER', 'CASHIER', 'STAFF') NOT NULL DEFAULT 'STAFF',
        status ENUM('ACTIVE', 'INVITED', 'DEACTIVATED') NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_business_user (business_id, user_id),
        INDEX idx_member_user (user_id),
        INDEX idx_member_biz (business_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. CATEGORIES
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cat_business (business_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. PRODUCTS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        store_id INT,
        category_id INT,
        name VARCHAR(200) NOT NULL,
        sku VARCHAR(100),
        barcode VARCHAR(100),
        brand VARCHAR(100),
        description TEXT,
        cost_price DECIMAL(10,2) DEFAULT 0.00,
        selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        tax_rate DECIMAL(5,2) DEFAULT 0.00,
        discount DECIMAL(10,2) DEFAULT 0.00,
        current_stock INT NOT NULL DEFAULT 0,
        min_stock_level INT NOT NULL DEFAULT 5,
        unit VARCHAR(20) DEFAULT 'pcs',
        image_url VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_prod_business (business_id),
        INDEX idx_prod_sku (sku),
        INDEX idx_prod_barcode (barcode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. INVENTORY MOVEMENTS (AUDIT TRAIL FOR STOCK)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        store_id INT,
        product_id INT NOT NULL,
        type ENUM('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE', 'RESTOCK') NOT NULL,
        quantity_change INT NOT NULL,
        quantity_before INT NOT NULL,
        quantity_after INT NOT NULL,
        reference_type VARCHAR(50),
        reference_id VARCHAR(100),
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_mov_business (business_id),
        INDEX idx_mov_product (product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. CUSTOMERS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(150),
        address TEXT,
        gstin VARCHAR(50),
        total_purchases DECIMAL(12,2) DEFAULT 0.00,
        order_count INT DEFAULT 0,
        outstanding_balance DECIMAL(10,2) DEFAULT 0.00,
        last_purchase_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cust_biz (business_id),
        INDEX idx_cust_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. ORDERS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) NOT NULL,
        business_id INT NOT NULL,
        store_id INT,
        customer_id INT NULL,
        subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        tax_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        discount_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        payment_method ENUM('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER') NOT NULL DEFAULT 'CASH',
        payment_status ENUM('PAID', 'PENDING', 'PARTIALLY_PAID', 'REFUNDED') NOT NULL DEFAULT 'PAID',
        status ENUM('COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
        notes TEXT,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_biz (business_id),
        INDEX idx_order_num (order_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 10. ORDER ITEMS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        business_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        sku VARCHAR(100),
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        tax_rate DECIMAL(5,2) DEFAULT 0.00,
        tax_amount DECIMAL(10,2) DEFAULT 0.00,
        discount_amount DECIMAL(10,2) DEFAULT 0.00,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_item_order (order_id),
        INDEX idx_item_biz (business_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 11. INVOICES
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL,
        business_id INT NOT NULL,
        store_id INT,
        order_id INT NOT NULL,
        customer_id INT NULL,
        customer_name VARCHAR(150),
        customer_phone VARCHAR(20),
        subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        tax_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        discount_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        payment_method VARCHAR(50) NOT NULL,
        payment_status ENUM('PAID', 'PENDING', 'PARTIALLY_PAID', 'CANCELLED', 'REFUNDED') DEFAULT 'PAID',
        pdf_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_inv_biz (business_id),
        INDEX idx_inv_num (invoice_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 12. RETURNS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS returns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_number VARCHAR(50) NOT NULL,
        business_id INT NOT NULL,
        store_id INT,
        order_id INT NOT NULL,
        invoice_id INT NOT NULL,
        total_refund DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        reason VARCHAR(255),
        processed_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ret_biz (business_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 13. RETURN ITEMS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS return_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        refund_amount DECIMAL(10,2) NOT NULL,
        restock BOOLEAN DEFAULT TRUE,
        INDEX idx_ret_item (return_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 14. EXPENSES
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        store_id INT,
        title VARCHAR(200) NOT NULL,
        category ENUM('Rent', 'Electricity', 'Salary', 'Inventory Purchase', 'Transport', 'Marketing', 'Other') DEFAULT 'Other',
        amount DECIMAL(10,2) NOT NULL,
        expense_date DATE NOT NULL,
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_exp_biz (business_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 15. SUBSCRIPTIONS & LIMITS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL UNIQUE,
        plan ENUM('FREE', 'STARTER', 'BUSINESS', 'PRO') NOT NULL DEFAULT 'FREE',
        status ENUM('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
        invoice_limit_per_month INT DEFAULT 100,
        product_limit INT DEFAULT 500,
        staff_limit INT DEFAULT 2,
        valid_until TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sub_biz (business_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 16. SETTINGS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL UNIQUE,
        invoice_prefix VARCHAR(10) DEFAULT 'QB',
        invoice_start_number INT DEFAULT 1001,
        tax_percentage DECIMAL(5,2) DEFAULT 18.00,
        currency VARCHAR(10) DEFAULT 'INR',
        footer_text TEXT,
        terms TEXT,
        logo_url VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_set_biz (business_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 17. AUDIT LOGS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        user_id INT NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50),
        metadata JSON,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_biz (business_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 18. OTP VERIFICATION (Preserved from legacy)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS otp_verification (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_verified TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_otp_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure cost_price exists on order_items for existing databases
    const [cols]: any = await connection.query("SHOW COLUMNS FROM order_items LIKE 'cost_price'");
    if (!cols || cols.length === 0) {
      await connection.query("ALTER TABLE order_items ADD COLUMN cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER unit_price;");
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1;");

    console.log("✅ QuickBill multi-tenant database migration completed successfully!");
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message);
    throw err;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  runMigration()
    .then(() => {
      console.log("Migration finished.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration error:", err);
      process.exit(1);
    });
}
