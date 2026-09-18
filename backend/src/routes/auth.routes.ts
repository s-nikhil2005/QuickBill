import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticateUser } from "../middlewares/auth";
import {
  loginRateLimiter,
  registerRateLimiter,
  otpRateLimiter,
  passwordResetRateLimiter
} from "../middlewares/rateLimiter";

const router = Router();

router.post("/register", registerRateLimiter, AuthController.register);
router.post("/login", loginRateLimiter, AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", authenticateUser, AuthController.me);
router.post("/send-otp", otpRateLimiter, AuthController.sendOtp);
router.post("/verify-otp", otpRateLimiter, AuthController.verifyOtp);
router.post("/reset-password", passwordResetRateLimiter, AuthController.resetPassword);

export default router;
