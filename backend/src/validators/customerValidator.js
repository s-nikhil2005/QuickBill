exports.createCustomerValidator = (req, res, next) => {
  const { name, phone } = req.body;

  if (!name) return res.status(400).json({ message: "Name is required" });
  if (!phone) return res.status(400).json({ message: "Phone is required" });

  if (phone.length !== 10) {
    return res.status(400).json({ message: "Phone must be 10 digits" });
  }

  next();
};

exports.updateCustomerValidator = (req, res, next) => {
  const { phone } = req.body;

  if (phone && phone.length !== 10) {
    return res.status(400).json({ message: "Phone must be 10 digits" });
  }

  next();
};
