import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";

async function runRestore() {
  console.log("🔄 Starting QuickBill Database Restoration...");
  const startTime = Date.now();

  const backupDir = path.resolve(__dirname, "../../backups");
  let targetFile = process.argv[2];

  if (!targetFile) {
    if (!fs.existsSync(backupDir)) {
      console.error("❌ No backups directory found at:", backupDir);
      process.exit(1);
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith(".sql"))
      .map(f => ({
        name: f,
        fullPath: path.join(backupDir, f),
        mtime: fs.statSync(path.join(backupDir, f)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
      console.error("❌ No .sql backup files found in:", backupDir);
      process.exit(1);
    }

    targetFile = files[0].fullPath;
    console.log(`ℹ️ No file specified. Using most recent backup: ${files[0].name}`);
  } else {
    targetFile = path.resolve(targetFile);
    if (!fs.existsSync(targetFile)) {
      console.error(`❌ Specified backup file does not exist: ${targetFile}`);
      process.exit(1);
    }
  }

  console.log(`  Reading backup from: ${targetFile}`);
  const sqlContent = fs.readFileSync(targetFile, "utf8");

  // Create single connection with multipleStatements enabled
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST as string,
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_NAME as string,
    multipleStatements: true
  });

  try {
    console.log("  Executing SQL restore statements...");
    await connection.query(sqlContent);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Database successfully restored from backup!`);
    console.log(`  Source File: ${targetFile}`);
    console.log(`  Time Elapsed: ${elapsed}s\n`);
  } catch (err) {
    console.error("❌ Restoration failed with error:", err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runRestore();
