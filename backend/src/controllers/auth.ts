import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import UserModel from "../models/user";
import otpService from "../services/otp";
import otpModel from "../models/otp";

/* ========================== SIGN UP ========================== */
export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const otpRecord = await otpModel.getLatestOtp(email);
    if (!otpRecord || otpRecord.is_verified === 0) {
      res.status(400).json({ message: "Please verify OTP first" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await UserModel.createUser({
      name,
      email,
      password: hashedPassword,
      role
    });

    await otpModel.deleteOtp(email);

    const token = jwt.sign(
      { userId, role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({ message: "User registered successfully", userId });
  } catch (err: any) {
    res.status(500).json({ message: "User cannot register", error: err.message });
  }
};

/* ========================== LOGIN ========================== */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password required" });
      return;
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({ message: "Login successful" });
  } catch (err: any) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* ========================== LOGOUT ========================== */
export const logoutUser = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
};

/* ========================== PROFILE ========================== */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  res.json((req as any).user);
};

/* ========================== SIGNUP OTP ========================== */
export const signUpSendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: "User already registered" });
      return;
    }

    await otpService.sendOtpEmail(email, "signup");
    res.json({ message: "OTP sent to email" });
  } catch (err: any) {
    res.status(500).json({ message: "Error sending OTP", error: err.message });
  }
};

export const signUpVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const result = await otpService.verifyOtp(email, otp, "signup");
    if (!result.success) {
      res.status(400).json({ message: result.message });
      return;
    }

    res.json({ message: "OTP verified successfully" });
  } catch (err: any) {
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
};

export const signUpResendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    await otpModel.deleteOtp(email);
    await otpService.sendOtpEmail(email, "signup");

    res.json({ message: "OTP resent successfully" });
  } catch (err: any) {
    res.status(500).json({ message: "Error resending OTP", error: err.message });
  }
};

/* ========================== RESET PASSWORD ========================== */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      res.status(400).json({ message: "Passwords do not match" });
      return;
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const otpRecord = await otpModel.getLatestOtp(email);
    if (!otpRecord || otpRecord.is_verified === 0) {
      res.status(400).json({ message: "Verify OTP first" });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(email, hashed);
    await otpModel.deleteOtp(email);

    res.json({ message: "Password reset successful" });
  } catch (err: any) {
    res.status(500).json({ message: "Reset failed", error: err.message });
  }
};

export const resetPasswordSendOtp = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await UserModel.findByEmail(email);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  await otpService.sendOtpEmail(email, "resetPassword");
  res.json({ message: "OTP sent" });
};

export const resetPasswordVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  const result = await otpService.verifyOtp(email, otp, "resetPassword");
  if (!result.success) {
    res.status(400).json({ message: result.message });
    return;
  }

  res.json({ message: "OTP verified" });
};

/* ========================== UPDATE PROFILE ========================== */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user!.id;
  const updates = req.body;

  await UserModel.updateById(userId, updates);
  res.json({ message: "Profile updated successfully" });
};

export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user!.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    res.status(400).json({ message: "Passwords do not match" });
    return;
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    res.status(400).json({ message: "Current password incorrect" });
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await UserModel.updatePasswordById(userId, hashed);

  res.json({ message: "Password updated successfully" });
};

/* ========================== UPDATE EMAIL ========================== */
export const updateEmail = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).user!.id;
  const { newEmail } = req.body;

  const exists = await UserModel.findByEmail(newEmail);
  if (exists) {
    res.status(400).json({ message: "Email already in use" });
    return;
  }

  await UserModel.updateById(userId, { email: newEmail });
  res.json({ message: "Email updated successfully" });
};

export const updateEmailSendOtp = async (req: Request, res: Response): Promise<void> => {
  const { newEmail } = req.body;
  await otpService.sendOtpEmail(newEmail, "updateEmail");
  res.json({ message: "OTP sent" });
};

export const updateEmailVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  const { newEmail, otp } = req.body;

  const result = await otpService.verifyOtp(newEmail, otp, "updateEmail");
  if (!result.success) {
    res.status(400).json({ message: result.message });
    return;
  }

  res.json({ message: "OTP verified" });
};

export const updateEmailResendOtp = async (req: Request, res: Response): Promise<void> => {
  const { newEmail } = req.body;

  await otpModel.deleteOtp(newEmail);
  await otpService.sendOtpEmail(newEmail, "updateEmail");

  res.json({ message: "OTP resent successfully" });
};
