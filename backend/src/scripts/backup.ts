import fs from "fs";
import path from "path";
import db from "../config/db";

async function runBackup() {
  console.log("📦 Starting QuickBill Database Backup...");
  const startTime = Date.now();

  try {
    const [tablesRows]: any = await db.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    const dbName = process.env.DB_NAME || "quickbill";
    const tables: string[] = tablesRows.map((row: any) => Object.values(row)[0] as string);

    if (tables.length === 0) {
      console.warn("⚠️ No tables found to back up.");
      process.exit(0);
    }

    let sqlDump = `-- ========================================================\n`;
    sqlDump += `-- QuickBill SaaS Database Backup\n`;
    sqlDump += `-- Database: ${dbName}\n`;
    sqlDump += `-- Timestamp: ${new Date().toISOString()}\n`;
    sqlDump += `-- ========================================================\n\n`;
    sqlDump += `SET NAMES utf8mb4;\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    let totalRowsCount = 0;

    for (const table of tables) {
      console.log(`  Dumping table: ${table}...`);
      
      // 1. Table structure
      const [createRows]: any = await db.query(`SHOW CREATE TABLE \`${table}\``);
      const createTableSql = createRows[0]["Create Table"];
      
      sqlDump += `-- --------------------------------------------------------\n`;
      sqlDump += `-- Structure for table \`${table}\`\n`;
      sqlDump += `-- --------------------------------------------------------\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
      sqlDump += `${createTableSql};\n\n`;

      // 2. Table data
      const [rows]: any = await db.query(`SELECT * FROM \`${table}\``);
      if (rows && rows.length > 0) {
        totalRowsCount += rows.length;
        sqlDump += `-- Dumping data for table \`${table}\` (${rows.length} rows)\n`;
        sqlDump += `LOCK TABLES \`${table}\` WRITE;\n`;

        for (const row of rows) {
          const keys = Object.keys(row).map(k => `\`${k}\``).join(", ");
          const values = Object.values(row).map(val => {
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "number" || typeof val === "boolean") return String(val);
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            const strVal = typeof val === "object" ? JSON.stringify(val) : String(val);
            // Escape single quotes and backslashes
            const escaped = strVal
              .replace(/\\/g, "\\\\")
              .replace(/'/g, "\\'")
              .replace(/\n/g, "\\n")
              .replace(/\r/g, "\\r");
            return `'${escaped}'`;
          }).join(", ");

          sqlDump += `INSERT INTO \`${table}\` (${keys}) VALUES (${values});\n`;
        }

        sqlDump += `UNLOCK TABLES;\n\n`;
      }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    sqlDump += `-- Backup completed successfully\n`;

    // Ensure backups directory exists
    const backupDir = path.resolve(__dirname, "../../backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `quickbill_backup_${timestamp}.sql`;
    const targetPath = path.join(backupDir, filename);

    fs.writeFileSync(targetPath, sqlDump, "utf8");

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const sizeKb = (fs.statSync(targetPath).size / 1024).toFixed(1);

    console.log(`\n✅ Backup successfully generated!`);
    console.log(`  File: ${targetPath}`);
    console.log(`  Tables: ${tables.length}`);
    console.log(`  Total Rows: ${totalRowsCount}`);
    console.log(`  Size: ${sizeKb} KB`);
    console.log(`  Time Elapsed: ${elapsed}s\n`);
  } catch (err) {
    console.error("❌ Backup failed with error:", err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runBackup();
