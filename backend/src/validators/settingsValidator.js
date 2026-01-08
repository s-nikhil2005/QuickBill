exports.settingsValidator = (req, res, next) => {
  const { business_name, email, phone, tax_percentage } = req.body;

  if (!business_name || business_name.trim() === "") {
    return res.status(400).json({ message: "Business name is required" });
  }

  if (email && !email.includes("@")) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  if (phone && phone.length !== 10) {
    return res.status(400).json({ message: "Phone must be 10 digits" });
  }

  if (tax_percentage !== undefined && tax_percentage < 0) {
    return res.status(400).json({ message: "Tax percentage cannot be negative" });
  }

  next();
};
