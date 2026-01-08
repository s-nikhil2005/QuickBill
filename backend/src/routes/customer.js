const express = require("express");
const customerRouter = express.Router();

const auth = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");

const {
  createCustomer,
  getAllCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  getCustomerInvoices
} = require("../controllers/customer");

const {
  createCustomerValidator,
  updateCustomerValidator
} = require("../validators/customerValidator");

// Create customer
customerRouter.post("/", auth, checkPermission("can_add_customer"), createCustomerValidator, createCustomer);

// Get all customers
customerRouter.get("/", auth, getAllCustomers);

// Get single customer
customerRouter.get("/:id", auth, getCustomer);

// Update customer
customerRouter.patch("/:id", auth, updateCustomerValidator, updateCustomer);

// Delete customer
customerRouter.delete("/:id", auth, checkPermission("can_delete_customer"), deleteCustomer);

// Search customers (by name/phone)
customerRouter.get("/search/query", auth, searchCustomers);

// Get all invoices of a customer
customerRouter.get("/:id/invoices", auth, getCustomerInvoices);

module.exports = customerRouter;
