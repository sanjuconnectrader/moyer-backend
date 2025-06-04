import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import transporter, { generateOTP } from '../config/nodemailer.js'; // adjust path as needed

/* ---------- POST /api/auth/reset/request ---------- */
export const requestReset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const { email } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin)
      return res.status(404).json({ message: 'Account not found.' });

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await admin.update({ resetOTP: otp, resetOTPExpires: expires });

    await transporter.sendMail({
      from: `"Moyer Production" <${process.env.EMAIL_USER}>`,
      to: admin.email,
      subject: 'Your Password Reset Code - Moyer Production',
      html: generateResetEmailTemplate(admin.adminName, otp)
    });

    return res.json({ message: 'OTP sent to registered e-mail.' });
  } catch (err) {
    next(err);
  }
};

const generateResetEmailTemplate = (name, otp) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Moyer Production</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
      
      body {
        font-family: 'Poppins', Arial, sans-serif;
        background-color: #f5f7fa;
        margin: 0;
        padding: 0;
        color: #333;
        line-height: 1.6;
      }
      
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .header {
        background-color: #1a365d;
        padding: 30px 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      }
      
      .logo {
        color: #ffffff;
        font-size: 28px;
        font-weight: 700;
        text-decoration: none;
      }
      
      .logo span {
        color: #4299e1;
      }
      
      .content {
        background-color: #ffffff;
        padding: 30px;
        border-radius: 0 0 8px 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      h1 {
        color: #1a365d;
        font-size: 24px;
        margin-top: 0;
      }
      
      .otp-container {
        background-color: #f8fafc;
        border: 1px dashed #cbd5e0;
        padding: 20px;
        text-align: center;
        margin: 25px 0;
        border-radius: 6px;
      }
      
      .otp-code {
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 3px;
        color: #1a365d;
        margin: 10px 0;
      }
      
      .button {
        display: inline-block;
        background-color: #4299e1;
        color: #ffffff !important;
        text-decoration: none;
        padding: 12px 25px;
        border-radius: 4px;
        font-weight: 600;
        margin: 20px 0;
      }
      
      .footer {
        text-align: center;
        margin-top: 30px;
        color: #718096;
        font-size: 14px;
      }
      
      .address {
        margin-top: 20px;
        font-style: normal;
        color: #4a5568;
      }
      
      @media only screen and (max-width: 600px) {
        .container {
          width: 100%;
        }
        
        .content {
          padding: 20px;
        }
        
        h1 {
          font-size: 20px;
        }
        
        .otp-code {
          font-size: 28px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <a href="https://moyerproduction.com" class="logo">MOYER<span>PRODUCTION</span></a>
      </div>
      
      <div class="content">
        <h1>Password Reset Request</h1>
        
        <p>Hello ${name},</p>
        
        <p>We received a request to reset your password for your Moyer Production account. Please use the following One-Time Password (OTP) to proceed:</p>
        
        <div class="otp-container">
          <div class="otp-code">${otp}</div>
          <p>This code will expire in 10 minutes.</p>
        </div>
        
        <p>If you didn't request this password reset, please ignore this email or contact our support team if you have any concerns.</p>
        
        <p>Best regards,<br>The Moyer Production Team</p>
        
        <div class="address">
          <p>Moyer Production<br>Bonney Lake, WA</p>
        </div>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Moyer Production. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/* ---------- POST /api/auth/reset/verify ---------- */
export const verifyReset = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const { email, otp, newPassword } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin || !admin.resetOTP)
      return res.status(400).json({ message: 'Invalid or expired OTP.' });

    if (admin.resetOTP !== otp)
      return res.status(400).json({ message: 'Incorrect OTP.' });

    if (admin.resetOTPExpires < new Date())
      return res.status(400).json({ message: 'OTP has expired.' });

    const hashed = await bcrypt.hash(newPassword, 12);

    await admin.update({
      password: hashed,
      resetOTP: null,
      resetOTPExpires: null
    });

    return res.json({ message: 'Password reset successful.' });
  } catch (err) {
    next(err);
  }
};
