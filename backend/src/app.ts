import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import businessRoutes from "./routes/business.routes";
import productRoutes from "./routes/product.routes";
import inventoryRoutes from "./routes/inventory.routes";
import customerRoutes from "./routes/customer.routes";
import billingRoutes from "./routes/billing.routes";
import invoiceRoutes from "./routes/invoice.routes";
import returnRoutes from "./routes/return.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import reportRoutes from "./routes/report.routes";
import employeeRoutes from "./routes/employee.routes";
import expenseRoutes from "./routes/expense.routes";
import settingsRoutes from "./routes/settings.routes";

import { errorHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/logger";

const app: Application = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5500",
  process.env.CLIENT_URL || "http://localhost:3000"
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development
      }
    },
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString(), platform: "QuickBill SaaS v1.0.0" });
});

// Primary v1 SaaS API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/businesses", businessRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/returns", returnRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/settings", settingsRoutes);

// Symmetrical aliases (/api/* and /api/v1/*)
app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/settings", settingsRoutes);

// Centralized Error Handling
app.use(errorHandler);

export default app;
