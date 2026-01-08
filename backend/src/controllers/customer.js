const CustomerModel = require("../models/Customer");
const BillingModel = require("../models/billing");

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    const id = await CustomerModel.createCustomer({ name, phone, email });

    res.status(201).json({
      message: "Customer created successfully",
      customer_id: id
    });

  } catch (err) {
    res.status(500).json({ message: "Error creating customer", error: err.message });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await CustomerModel.getAllCustomers();
    res.status(200).json({ customers });
  } catch (err) {
    res.status(500).json({ message: "Error fetching customers", error: err.message });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const customer = await CustomerModel.getCustomerById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    res.status(200).json({ customer });
  } catch (err) {
    res.status(500).json({ message: "Error fetching customer", error: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    await CustomerModel.updateCustomer(req.params.id, req.body);

    res.status(200).json({ message: "Customer updated successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error updating customer", error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    await CustomerModel.deleteCustomer(req.params.id);

    res.status(200).json({ message: "Customer deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error deleting customer", error: err.message });
  }
};

exports.searchCustomers = async (req, res) => {
  try {
    const { name, phone } = req.query;

    const results = await CustomerModel.searchCustomers({ name, phone });

    res.status(200).json({ customers: results });

  } catch (err) {
    res.status(500).json({ message: "Error searching customers", error: err.message });
  }
};

exports.getCustomerInvoices = async (req, res) => {
  try {
    const invoices = await BillingModel.getInvoicesByCustomer(req.params.id);

    res.status(200).json({ invoices });

  } catch (err) {
    res.status(500).json({ message: "Error fetching invoices", error: err.message });
  }
};
