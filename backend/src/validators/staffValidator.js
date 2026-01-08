exports.createStaffValidator = (req, res, next) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  if (phone && phone.length !== 10) {
    return res.status(400).json({ message: "Phone must be 10 digits" });
  }

  next();
};
