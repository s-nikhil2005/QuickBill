import {Router} from "express";
import auth from "../middlewares/auth";

import {
  signUp,
  loginUser,
  getProfile,
  logoutUser,
  signUpSendOtp,
  signUpVerifyOtp,
   signUpResendOtp,
  resetPassword,
  resetPasswordSendOtp,
  resetPasswordVerifyOtp,
  updateProfile,
  updatePassword,
  updateEmail,
  updateEmailSendOtp,
  updateEmailVerifyOtp,
  // resetPasswordResendOtp,
  updateEmailResendOtp
} from "../controllers/auth";


import {signUpValidator,
  emailValidator
} from "../validators/authValidator";

const router = Router();

// SIGNUP ROUTES
router.post("/signUp", signUpValidator, signUp);
router.post("/signup/sendotp", signUpSendOtp);
router.post("/signup/verifyotp", signUpVerifyOtp);
router.post("/signup/resendotp", emailValidator, signUpResendOtp);

// LOGIN / LOGOUT
router.post("/login", loginUser);
router.post("/logout", auth, logoutUser);

// PROFILE
router.get("/profile", auth, getProfile);
router.patch("/updateProfile", auth, updateProfile);

// // FORGOT PASSWORD
router.post("/resetPassword", resetPassword);
router.post("/resetPassword/sendotp", resetPasswordSendOtp);
router.post("/resetPassword/verifyotp", resetPasswordVerifyOtp);
// router.post("/resetPassword/resendotp", emailValidator, resetPasswordResendOtp);

// UPDATE PASSWORD
router.patch("/updatePassword", auth,  updatePassword);

// // UPDATE EMAIL
router.patch("/updateEmail", auth, updateEmail);
router.post("/updateEmail/sendotp", auth, emailValidator, updateEmailSendOtp);
router.post("/updateEmail/verifyotp", auth, updateEmailVerifyOtp);
router.post("/updateEmail/resendotp", auth, emailValidator, updateEmailResendOtp);

export default router;

