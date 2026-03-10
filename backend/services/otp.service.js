import nodemailer from 'nodemailer';
import crypto from 'crypto';

// In-memory OTP store (in production, use Redis)
const otpStore = new Map();

// Generate 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Store OTP with expiry (5 minutes)
export const storeOTP = (identifier, otp) => {
  otpStore.set(identifier, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    attempts: 0,
  });
};

// Verify OTP
export const verifyOTP = (identifier, inputOtp) => {
  const stored = otpStore.get(identifier);
  
  if (!stored) {
    return { valid: false, message: 'OTP expired or not found. Please request a new one.' };
  }
  
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(identifier);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }
  
  if (stored.attempts >= 3) {
    otpStore.delete(identifier);
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }
  
  if (stored.otp !== inputOtp) {
    stored.attempts++;
    return { valid: false, message: `Invalid OTP. ${3 - stored.attempts} attempts remaining.` };
  }
  
  // OTP verified successfully
  otpStore.delete(identifier);
  return { valid: true, message: 'OTP verified successfully!' };
};

// Create email transporter
const createTransporter = () => {
  // Using Gmail SMTP - you'll need to enable "Less secure app access" 
  // or use App Password if 2FA is enabled
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send OTP via Email
export const sendEmailOTP = async (email, otp) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"PRAJA Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your OTP for PRAJA Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
            .container { max-width: 500px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%); padding: 30px; text-align: center; }
            .content { padding: 30px; background: #fff; }
            .otp-box { background: linear-gradient(135deg, #0d9488, #14b8a6); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 12px; text-align: center; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 8px; margin-top: 20px; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 24px;">🏡️ PRAJA Portal</h1>
              <p style="margin: 10px 0 0; color: #333;">प्रजा - Citizen Grievance Management</p>
            </div>
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Verify Your Account</h2>
              <p style="color: #666; line-height: 1.6;">
                Hello! Use the following One-Time Password (OTP) to verify your account:
              </p>
              <div class="otp-box">${otp}</div>
              <p style="color: #666; font-size: 14px;">
                This OTP is valid for <strong>5 minutes</strong>.
              </p>
              <div class="warning">
                ⚠️ <strong>Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message from PRAJA Portal.</p>
              <p>स्वच्छ भारत • सुंदर भारत</p>
              <p style="margin-top: 10px;">© 2026 Digital India Initiative</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Your OTP for PRAJA Portal is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nDo not share this OTP with anyone.`,
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw new Error('Failed to send OTP. Please try again.');
  }
};

// Send OTP via SMS
export const sendSMSOTP = async (phone, otp) => {
  console.log(`📱 SMS OTP for ${phone}: ${otp}`);

  // Fast2SMS — easiest Indian SMS provider (no DLT needed for OTP route)
  // Get free API key at: https://www.fast2sms.com
  if (process.env.FAST2SMS_API_KEY) {
    try {
      const resp = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: phone,
        }),
      });
      const data = await resp.json();
      if (data.return === true) {
        console.log(`✅ SMS sent to ${phone} via Fast2SMS`);
        return { success: true };
      }
      console.error('❌ Fast2SMS error:', data.message);
    } catch (smsError) {
      console.error('❌ Fast2SMS failed:', smsError.message);
    }
  }

  // MSG91 (Indian SMS provider — requires DLT template registration)
  // Get credentials at: https://msg91.com
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    try {
      const url = `https://api.msg91.com/api/v5/otp?template_id=${process.env.MSG91_TEMPLATE_ID}&mobile=91${phone}&otp=${otp}`;
      const resp = await fetch(url, { headers: { authkey: process.env.MSG91_AUTH_KEY } });
      const data = await resp.json();
      if (data.type === 'success') {
        console.log(`✅ SMS sent to ${phone} via MSG91`);
        return { success: true };
      }
    } catch (smsError) {
      console.error('❌ MSG91 SMS failed:', smsError.message);
    }
  }

  // No SMS provider configured — return otp so the route can show it on screen in dev mode
  return { success: true, otp };
};

// Combined function to send OTP
export const sendOTP = async (identifier, type = 'email') => {
  const otp = generateOTP();
  storeOTP(identifier, otp);

  let smsResult = null;
  if (type === 'email') {
    await sendEmailOTP(identifier, otp);
  } else if (type === 'phone') {
    smsResult = await sendSMSOTP(identifier, otp);
  }

  const result = { success: true, message: `OTP sent to your ${type}` };
  // Bubble up OTP when SMS provider is not configured (dev visibility)
  if (type === 'phone' && smsResult?.otp) {
    result.otp = smsResult.otp;
  }
  return result;
};
