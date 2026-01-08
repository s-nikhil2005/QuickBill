const transporter = require("../config/mail");
const generateOtp = require("../utils/generateOtp");
const otpModel = require("../models/otp");


exports.sendOtpEmail = async (email)=> {
    const otp = generateOtp();
    const expireAt = new Date(Date.now() + 1 * 60 * 1000);

    await otpModel.saveOtp(email, otp, expireAt);

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to:email,
        subject: "Your QuickBill OTP Code",
        html: `
    <div style="font-family: Arial, sans-serif; background: #f8f9fa; padding: 20px;">
      <div style="max-width: 500px; margin: auto; background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
        
        <h2 style="color: #333; text-align: center;">🔐 Email Verification</h2>
        
        <p style="font-size: 16px; color: #555;">
          Hello,
          <br><br>
          Use the OTP below to verify your email address. This OTP is valid for 
          <b>1 minutes</b>.
        </p>

        <div style="text-align: center; margin: 20px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">
            ${otp}
          </div>
        </div>

        <p style="font-size: 14px; color: #777;">
          If you did not request this, please ignore this email or contact support.
        </p>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="font-size: 12px; color: #aaa; text-align: center;">
          © ${new Date().getFullYear()} QuickBill. All rights reserved.
        </p>

      </div>
    </div>
  `
    });
}

exports.verifyOtp = async (email, otp) => {
  const record = await otpModel.getLatestOtp(email);

  if (!record) {
    return { success: false, message: "No OTP found for this email" };
  }

  if (record.is_verified === 1) {
    return { success: false, message: "OTP already verified" };
  }

  if (record.otp !== otp) {
    return { success: false, message: "Invalid OTP" };
  }

  if (new Date(record.expires_at) < new Date()) {
    return { success: false, message: "OTP expired" };
  }

  await otpModel.markVerified(email);

  return { success: true };
};