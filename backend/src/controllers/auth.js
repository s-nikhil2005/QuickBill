const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");
const otpService = require("../services/otp");
const otpModel = require("../models/otp");



exports.signUp = async (req,res) => {

   try {
          const {name, email , password ,role}=req.body;

         const existingUser = await UserModel.findByEmail(email);
         
         if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User already exists"});
         }

           const otpRecord = await otpModel.getLatestOtp(email);

    if (!otpRecord || otpRecord.is_verified === 0) {
      return res.status(400).json({ message: "Please verify OTP first" });
    }

             const hashedPassword = await bcrypt.hash(password,10);
         const userId = await UserModel.createUser({
            name,
            email,
            password: hashedPassword,
            role
         });

         await otpModel.deleteOtp(email);
            const token = jwt.sign(
            { userId, role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
            );

            res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
            maxAge: 24 * 60 * 60 * 1000
            });

         

         res.status(201).json({message: "User registered successfully", userId});   
   }
  catch (err){
   
    res.status(500).json({ message: "User Cannot Register", error: err.message });
}

};

exports.loginUser = async (req,res)=>{
    try{
            const {email,password}=req.body;

            if(!email || !password){
               return  res.status(400).json({ message: "Email and Password are required" });
            }


            const user = await UserModel.findByEmail(email);

            if(!user){
                res.send("Invalid Credentials");
            }
            const passwordMatch = await bcrypt.compare(password,user.password);

            if(!passwordMatch){
                res.send("Invalid Credentials");
            }
               

            const token = jwt.sign(
                { userId: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.cookie("token",token,{
                httpOnly: true,
                secure: true,
                sameSite: "Strict",
                maxAge: 24 * 60 * 60 * 1000
            })
            res.status(200).json({ message: "Login successful"});
    }
    catch(err){
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.signUpSendOtp = async (req,res) => {

    try{
        const {email} = req.body;
        const existinguser = await UserModel.findByEmail(email);
        if(!existinguser){
            return res.status(404).json({ message: "User not found"});
        }
             await otpService.sendOtpEmail(email);

              res.json({ message: "OTP sent to email" });
            
    }
    catch(err){
      res.status(500).json({ message: "Error sending OTP", error: err.message });
    }
};

exports.signUpVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email & OTP required" });
    }

    const result = await otpService.verifyOtp(email, otp);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    return res.json({ message: "OTP verified successfully" });

  } catch (err) {
    return res.status(500).json({ 
      message: "Error verifying OTP", 
      error: err.message 
    });
  }
};

exports.resetPassword = async (req,res) => {
   try {

    const {email , newPassword, confurmPassword} = req.body;

    const verifyUser = await UserModel.findByEmail(email);
    
    if (!verifyUser){
        return res.status(404).json({ message: "User not found"});
    }

    const otpRecord = await otpModel.getLatestOtp(email);

    if (!otpRecord || otpRecord.is_verified === 0) {
      return res.status(400).json({ message: "Please verify OTP first" });
    }

    if (newPassword !== confurmPassword ){
        return res.status(400).json({ message: "Password do not match"});
    }

     const hashedPassword = await bcrypt.hash(newPassword, 10);

    await UserModel.updatePassword(email, hashedPassword);

    await otpModel.deleteOtp(email);

    res.send("reset Password successfull");

   }
   catch(err){
      res.status(500).json({ message: "Error resetting password", error: err.message });
   }
};

exports.resetPasswordSendOtp = async (req,res) => {

  try{
          const {email} = req.body;
          const existingUser = await UserModel.findByEmail(email);
          if(!existingUser){
              return res.status(404).json({ message: "User not found"});
          }
          await otpService.sendOtpEmail(email);
          res.json({ message: "OTP sent to email" });
  }
  catch(err){
    res.status(500).json({ message: "Error sending OTP", error: err.message });
  }
};

exports.resetPasswordVerifyOtp = async (req, res) => {

  try{
              const {email, otp}= req.body;
              if(!email || !otp){
                  return res.status(400).json({ message: "Email & OTP required"});
              }
              const result = await otpService.verifyOtp(email, otp);

              if(!result.success){
                  return res.status(400).json({ message: result.message});
              }
              return res.json({ message: "OTP verified successfully"});
  }
  catch(err){
      res.status(500).json({ message: "Error verifying OTP", error: err.message });
  }
};

exports.getProfile = async (req,res)=>{
   try{
  const user=req.user;
  res.send(user);

 }catch(err){
    res.status(400).send("Error Fetching Profile: " + err.message);
 }  
};

exports.logoutUser = async (req,res)=>{
    try{
           res.clearCookie("token");
           res.status(200).json({ message: "Logout successful"});    
    }
    catch(err){
        res.status(500).json({ message: "Server error", error: err.message });
    }

};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const allowedFields = ["name", "phone", "address", "DOB"];
    const updates = {};

    // pick only provided fields
    allowedFields.forEach(key => {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    await UserModel.updateById(userId, updates);

    res.status(200).json({
      message: "Profile updated successfully"
    });

  } catch (err) {
    res.status(500).json({
      message: "Error updating profile",
      error: err.message
    });
  }
};

exports. updatePassword = async (req, res) => {

  try{
         const userId = req.user.id;

         const {currentPassword,newPassword,confirmPassword} = req.body;

          if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
         const user = await UserModel.findById(userId);

          if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

          const passwordMatch = await bcrypt.compare(currentPassword,user.password);
          if (!passwordMatch){
            return res.status(400).json({ message: "Current password is incorrect"});
          }

          if (newPassword !== confirmPassword){
            return res.status(400).json({ message: "Password do not match"});
          }

          const hashedPassword = await bcrypt.hash(newPassword,10);

          await UserModel.updatePasswordById(userId,hashedPassword);

          res.status(200).json({ message: "Password updated successfully"});

  }
  catch(err){
    res.status(500).json({ message: "Error updating password", error: err.message });
  }
};

exports.updateEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({ message: "New email is required" });
    }

    // Check if email already exists
    const existingUser = await UserModel.findByEmail(newEmail);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Get OTP record
    const otpRecord = await otpModel.getLatestOtp(newEmail);

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found" });
    }

    // Check OTP purpose
    if (otpRecord.purpose !== "updateEmail") {
      return res.status(400).json({ message: "OTP is not for updating email" });
    }

    // Check OTP verification
    if (otpRecord.is_verified === 0) {
      return res.status(400).json({ message: "Please verify OTP first" });
    }

    // Update email
    await UserModel.updateById(userId, { email: newEmail });

    // Delete OTP after success
    await otpModel.deleteOtp(newEmail);

    return res.status(200).json({
      message: "Email updated successfully"
    });

  } catch (err) {
    return res.status(500).json({
      message: "Error updating email",
      error: err.message
    });
  }
};

exports.updateEmailSendOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent updating to same email
    if (user.email === newEmail) {
      return res.status(400).json({ message: "New email must be different from current email" });
    }

    // Check if email already exists
    const existingUser = await UserModel.findByEmail(newEmail);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Clear old OTP entries
    await otpModel.deleteOtp(newEmail);

    // Send OTP with specific purpose
    await otpService.sendOtpEmail(newEmail, "updateEmail");

    return res.json({ message: "OTP sent to email" });

  } catch (err) {
    return res.status(500).json({
      message: "Error sending OTP",
      error: err.message
    });
  }
};


exports.updateEmailVerifyOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail, otp } = req.body;

    // Validate input
    if (!newEmail || !otp) {
      return res.status(400).json({ message: "Email & OTP are required" });
    }

    // Prevent updating to same email
    if (req.user.email === newEmail) {
      return res.status(400).json({ message: "New email must be different from current email" });
    }

    // Check if email already exists
    const existingUser = await UserModel.findByEmail(newEmail);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Verify OTP
    const result = await otpService.verifyOtp(newEmail, otp, "updateEmail");

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // OTP verified successfully
    return res.status(200).json({
      message: "OTP verified successfully",
      isVerified: true
    });

  } catch (err) {
    return res.status(500).json({
      message: "Error verifying OTP",
      error: err.message
    });
  }
};

exports.signUpResendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check user does NOT already exist
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message: "User already registered with this email"
      });
    }

    // Delete older OTP
    await otpModel.deleteOtp(email);

    // Send new OTP
    await otpService.sendOtpEmail(email, "signup");

    return res.status(200).json({
      message: "OTP resent successfully"
    });

  } catch (err) {
    return res.status(500).json({
      message: "Error resending OTP",
      error: err.message
    });
  }
};

exports.resetPasswordResendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // For password reset → user MUST exist
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "Email not registered" });
    }

    await otpModel.deleteOtp(email);

    await otpService.sendOtpEmail(email, "resetPassword");

    return res.status(200).json({ message: "OTP resent successfully" });

  } catch (err) {
    return res.status(500).json({
      message: "Error resending OTP",
      error: err.message
    });
  }
};

exports.updateEmailResendOtp = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;

    if (!newEmail || !newEmail.includes("@")) {
      return res.status(400).json({ message: "Valid new email is required" });
    }

    const user = await UserModel.findById(userId);

    // Cannot update to same email
    if (user.email === newEmail) {
      return res.status(400).json({
        message: "New email must be different from current email"
      });
    }

    // New email should NOT belong to anyone
    const exists = await UserModel.findByEmail(newEmail);
    if (exists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    await otpModel.deleteOtp(newEmail);

    await otpService.sendOtpEmail(newEmail, "updateEmail");

    return res.status(200).json({
      message: "OTP resent successfully"
    });

  } catch (err) {
    return res.status(500).json({
      message: "Error resending OTP",
      error: err.message
    });
  }
};
