const validator = require("validator");

exports.signUpValidator = (req, res, next) => {
  const { email, password, name, role } = req.body;

   const allowedEmailDomains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "protonmail.com"
  ];


  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid or missing email" });
  }


    const domain = email.split("@")[1];
  if (!allowedEmailDomains.includes(domain)) {
    return res.status(400).json({
      message: "Use a real email like Gmail, Yahoo, Outlook, Hotmail, iCloud"
    });
  }

  
  if (
    !password ||
    !validator.isStrongPassword(password, { minLength: 10 })  
  ) {
    return res.status(400).json({
      message:
        "Password must be at least 10 characters, contain uppercase, lowercase, number, and special character",
    });
  }


  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Name is required" });
  }

  if (role !== "admin" && role !== "staff") {
    return res
      .status(400)
      .json({ message: "Role must be either 'admin' or 'staff'" });
  }

 
  next();
};

exports.emailValidator = (req, res, next) => {

  const { email } = req.body;

  const allowedEmailDomains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "protonmail.com"
  ];

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid or missing email" });
  }
    const domain = email.split("@")[1];
  if (!allowedEmailDomains.includes(domain)) {
    return res.status(400).json({
      message: "Use a real email like Gmail, Yahoo, Outlook, Hotmail, iCloud"
    });
  }

  next();
}
