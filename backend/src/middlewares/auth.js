const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
   
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Authentication Failed: No Token" });
    }

   
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.userId; 

  
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "Authentication Failed: User not found" });
    }

  
    req.user = user;

    next();

  } catch (err) {
    return res.status(401).json({
      message: "Authentication Failed",
      error: err.message,
    });
  }
};

module.exports = userAuth;
