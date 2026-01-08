const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRouters = require ("./routes/auth");
const productRouter = require("./routes/product");
const permissionRouter = require ("./routes/permission");
const billingRouter = require ("./routes/billing");
const customerRouter = require ("./routes/customer");
const dashboardRouter = require ("./routes/dashboard");
const returnRouter = require ("./routes/return");
const settingRouter = require("./routes/setting");
const staffRouter = require("./routes/staff");

const app=express();
 
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use(cors({
  origin: "http://127.0.0.1:5500",  // Live Server URL
  credentials: true
}));

app.use("/api/auth",authRouters);
app.use("/api/products", productRouter);
app.use("/api/permissions", permissionRouter);
app.use("/api/billing",billingRouter);
app.use("/api/customers",customerRouter);
app.use("/api/dashboard",dashboardRouter);
app.use("/api/returns",returnRouter);
app.use("/api/settings",settingRouter);
app.use("/api/staff",staffRouter);


module.exports=app;