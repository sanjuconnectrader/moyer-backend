import { validationResult } from 'express-validator';
import Admin from '../models/Admin.js';
import {
  hashPassword,
  comparePassword,
  generateToken,          // JWT
} from '../utils/authUtils.js';
import { generateApprovalToken } from '../utils/generateToken.js';
import transporter from '../utils/mailer.js';

/* ---------- POST /api/auth/register ---------- */
export const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const { adminName, email, password } = req.body;
    const existing = await Admin.findOne({ where: { email } });
    if (existing)
      return res.status(409).json({ message: 'Email already registered.' });

    const hashed        = await hashPassword(password);
    const approvalToken = generateApprovalToken();

    await Admin.create({
      adminName,
      email,
      password: hashed,
      approvalToken,
      isApproved: false,
    });

    /* ------------- Send approval request ------------- */
    const supportMail = {
      from: '"Connectrader" <no-reply@connectrader.com>',
      to:   'support@connectrader.com',
      subject: `Manual approval needed: ${email}`,
      html: `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Approval Request</title>
    <style>
        /* Base Styles */
        body {
            font-family: 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f7f9fc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .header {
            background: linear-gradient(135deg, #4361ee, #3a0ca3);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        
        .logo {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .content {
            padding: 30px;
        }
        
        h1 {
            color: #2b2d42;
            font-size: 22px;
            margin-top: 0;
            margin-bottom: 20px;
        }
        
        .details-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            border-left: 4px solid #4361ee;
        }
        
        .detail-row {
            display: flex;
            margin-bottom: 10px;
        }
        
        .detail-label {
            font-weight: 600;
            color: #495057;
            min-width: 80px;
        }
        
        .detail-value {
            color: #212529;
        }
        
        .actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-top: 30px;
            flex-wrap: wrap;
        }
        
        .action-btn {
            display: inline-block;
            padding: 12px 25px;
            border-radius: 6px;
            font-weight: 600;
            text-decoration: none;
            text-align: center;
            transition: all 0.3s ease;
            min-width: 120px;
        }
        
        .approve-btn {
            background-color: #2ecc71;
            color: white;
        }
        
        .approve-btn:hover {
            background-color: #27ae60;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
        }
        
        .deny-btn {
            background-color: #e74c3c;
            color: white;
        }
        
        .deny-btn:hover {
            background-color: #c0392b;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #6c757d;
            background-color: #f8f9fa;
            border-top: 1px solid #e9ecef;
        }
        
        /* Responsive Adjustments */
        @media only screen and (max-width: 480px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header {
                padding: 20px 15px;
            }
            
            .content {
                padding: 20px 15px;
            }
            
            .actions {
                flex-direction: column;
                gap: 10px;
            }
            
            .action-btn {
                width: 100%;
                padding: 14px;
            }
            
            .detail-row {
                flex-direction: column;
            }
            
            .detail-label {
                margin-bottom: 2px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">Connectrader</div>
            <h1>Admin Approval Request</h1>
        </div>
        
        <div class="content">
            <p>You have a new administrator registration pending approval:</p>
            
            <div class="details-card">
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${adminName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${email}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                </div>
            </div>
            
            <p>Please review and take appropriate action:</p>
            
            <div class="actions">
                <a href="${process.env.BACKEND_URL}/api/admin/approval/${approvalToken}?action=approve" class="action-btn approve-btn">✓ Approve</a>
                <a href="${process.env.BACKEND_URL}/api/admin/approval/${approvalToken}?action=deny" class="action-btn deny-btn">✗ Deny</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply directly to this email.</p>
            <p>© ${new Date().getFullYear()} Connectrader. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`,
    };
    transporter.sendMail(supportMail).catch(console.error);
    /* -------------------------------------------------- */

    return res.status(201).json({
      message:
        'Registration received. An administrator must approve your account before you can log in.',
    });
  } catch (err) {
    next(err);
  }
};

/* ---------- POST /api/auth/login ---------- */
export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    const { email, password } = req.body;
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials.' });

    if (!admin.isApproved)
      return res
        .status(403)
        .json({ message: 'Account pending manual approval.' });

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = generateToken({ id: admin.id, email: admin.email });

    return res.status(200).json({
      token,
      expiresIn: '7d',
      admin: {
        id: admin.id,
        adminName: admin.adminName,
        email: admin.email,
      },
    });
  } catch (err) {
    next(err);
  }
};
