import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { AuthenticatedRequest } from "../types";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ success: false, message: "Name, email and password are required.", code: "VALIDATION_ERROR" });
        return;
      }

      const result = await AuthService.register({ name, email, password, phone });

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(201).json({
        success: true,
        message: "Account registered successfully",
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, message: "Email and password are required.", code: "VALIDATION_ERROR" });
        return;
      }

      const result = await AuthService.login(email, password);

      res.cookie("token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(_req: Request, res: Response) {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated", code: "UNAUTHORIZED" });
        return;
      }
      const data = await AuthService.getMe(req.user.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, purpose } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: "Email is required", code: "VALIDATION_ERROR" });
        return;
      }
      const result = await AuthService.sendOtp(email, purpose);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, purpose } = req.body;
      if (!email || !otp) {
        res.status(400).json({ success: false, message: "Email and OTP are required", code: "VALIDATION_ERROR" });
        return;
      }
      const result = await AuthService.verifyOtp(email, otp, purpose);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, newPassword, confirmPassword } = req.body;
      if (!email || !newPassword) {
        res.status(400).json({ success: false, message: "Email and new password are required", code: "VALIDATION_ERROR" });
        return;
      }
      if (newPassword !== confirmPassword) {
        res.status(400).json({ success: false, message: "Passwords do not match", code: "PASSWORD_MISMATCH" });
        return;
      }
      const result = await AuthService.resetPassword(email, newPassword);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
}
