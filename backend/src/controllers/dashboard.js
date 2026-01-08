const DashboardModel = require("../models/dashboard");

exports.totalSales = async (req, res) => {
  try {
    const total = await DashboardModel.getTotalSales();
    res.status(200).json({ total_sales: total });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
};

exports.totalInvoices = async (req, res) => {
  try {
    const count = await DashboardModel.getTotalInvoices();
    res.status(200).json({ total_invoices: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.totalCustomers = async (req, res) => {
  try {
    const count = await DashboardModel.getTotalCustomers();
    res.status(200).json({ total_customers: count });
  } catch (err) {
    res.status(500).json({ message: "Error fetching total customers", error: err.message });
  }
};

exports.lowStock = async (req, res) => {
  try {
    const products = await DashboardModel.getLowStock();
    res.status(200).json({ low_stock_products: products });
  } catch (err) {
    res.status(500).json({ message: "Error fetching low stock products", error: err.message });
  }
};

exports.topProducts = async (req, res) => {
  try {
    const products = await DashboardModel.getTopProducts();
    res.status(200).json({ top_selling_products: products });
  } catch (err) {
    res.status(500).json({ message: "Error fetching top selling products", error: err.message });
  }
};

exports.dailyRevenue = async (req, res) => {
  try {
    const sales = await DashboardModel.getDailyRevenue();
    res.status(200).json({ today_sales: sales });
  } catch (err) {
    res.status(500).json({ message: "Error fetching today's sales", error: err.message });
  }
};

exports.monthlySales = async (req, res) => {
  try {
    const data = await DashboardModel.getMonthlySales();
    res.status(200).json({ monthly_sales: data });
  } catch (err) {
    res.status(500).json({ message: "Error fetching monthly sales", error: err.message });
  }
};

exports.paymentSummary = async (req, res) => {
  try {
    const summary = await DashboardModel.getPaymentSummary();
    res.status(200).json({ payment_summary: summary });
  } catch (err) {
    res.status(500).json({ message: "Error fetching payment summary", error: err.message });
  }
};

exports.stockSummary = async (req, res) => {
  try {
    const summary = await DashboardModel.getStockSummary();
    res.status(200).json({ stock_summary: summary });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stock summary", error: err.message });
  }
};
