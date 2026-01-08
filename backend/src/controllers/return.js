const ReturnModel = require("../models/return");
const BillingModel = require("../models/billing");
const ProductModel = require("../models/product");

exports.returnFullInvoice = async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId;
    const { reason } = req.body;

    const items = await ReturnModel.getInvoiceItems(invoiceId);

    if (items.length === 0) {
      return res.status(400).json({ message: "No items found in this invoice" });
    }

    let total_refund = 0;

    // Calculate refund & restore stock
    for (let item of items) {
      total_refund += item.total;

      await ProductModel.updateStock(item.product_id, item.quantity); // increase stock
    }

    // Create return record
    const returnId = await ReturnModel.createReturn(
      invoiceId,
      reason || "Full invoice return",
      total_refund
    );

    // Insert return items
    for (let item of items) {
      await ReturnModel.addReturnItem(
        returnId,
        item.product_id,
        item.quantity,
        item.total
      );
    }

    res.status(200).json({
      message: "Full invoice returned successfully",
      return_id: returnId,
      total_refund
    });

  } catch (err) {
    res.status(500).json({ message: "Error processing return", error: err.message });
  }
};

exports.returnSingleItem = async (req, res) => {
  try {
    const { invoice_id, product_id, quantity, reason } = req.body;

    const items = await ReturnModel.getInvoiceItems(invoice_id);
    const item = items.find(i => i.product_id == product_id);

    if (!item) {
      return res.status(404).json({ message: "Product not found in invoice" });
    }

    if (quantity > item.quantity) {
      return res.status(400).json({ message: "Invalid return quantity" });
    }

    const refund_amount = item.price * quantity;

    const returnId = await ReturnModel.createReturn(
      invoice_id,
      reason || "Item return",
      refund_amount
    );

    await ReturnModel.addReturnItem(returnId, product_id, quantity, refund_amount);

    // Restore stock
    await ProductModel.updateStock(product_id, quantity);

    res.status(200).json({
      message: "Item returned successfully",
      return_id: returnId,
      refund_amount
    });

  } catch (err) {
    res.status(500).json({ message: "Error processing item return", error: err.message });
  }
};

exports.getAllReturns = async (req, res) => {
  try {
    const data = await ReturnModel.getAllReturns();
    res.status(200).json({ returns: data });
  } catch (err) {
    res.status(500).json({ message: "Error fetching returns", error: err.message });
  }
};

exports.getReturnDetails = async (req, res) => {
  try {
    const returnId = req.params.returnId;
    const data = await ReturnModel.getReturnDetails(returnId);

    if (!data.return) {
      return res.status(404).json({ message: "Return record not found" });
    }

    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ message: "Error fetching return details", error: err.message });
  }
};
