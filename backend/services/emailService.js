const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Verify transporter configuration (don't crash if it fails)
transporter.verify()
  .then(() => {
    console.log('SMTP Server is ready to send emails');
  })
  .catch((error) => {
    console.log('SMTP Configuration Error:', error.message || error);
    console.log('Email functionality will be disabled. Server will continue running.');
  });

// Email templates
const emailTemplates = {
  registrationSuccess: (name, username, password) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1b5e20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #1b5e20; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .credentials { background: #fff; padding: 15px; border-left: 4px solid #1b5e20; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to HOD Management System</h1>
        </div>
        <div class="content">
          <h2>Registration Successful!</h2>
          <p>Dear ${name},</p>
          <p>Your account has been successfully registered in the Telangana State HOD Management System.</p>
          
          <div class="credentials">
            <h3>Your Login Credentials:</h3>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Email:</strong> ${username.includes('@') ? username : 'Use your registered email'}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
          </div>
          
          <p><strong>Important:</strong> For security reasons, please change your password immediately after your first login.</p>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/change-password" class="button">Change Password</a>
          
          <p>If you have any questions, please contact the system administrator.</p>
          
          <div class="footer">
            <p>© 2024 Government of Telangana. All Rights Reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,

  forgotPasswordOTP: (name, otp) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1b5e20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-box { background: #fff; padding: 20px; text-align: center; border: 2px dashed #1b5e20; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #1b5e20; letter-spacing: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          <p>You have requested to reset your password for the HOD Management System.</p>
          
          <div class="otp-box">
            <p>Your One-Time Password (OTP) is:</p>
            <div class="otp-code">${otp}</div>
            <p style="font-size: 12px; margin-top: 10px;">This OTP is valid for 10 minutes only.</p>
          </div>
          
          <div class="warning">
            <p><strong>Security Notice:</strong></p>
            <p>If you did not request this password reset, please ignore this email or contact the administrator immediately.</p>
          </div>
          
          <p>Enter this OTP on the password reset page to create a new password.</p>
          
          <div class="footer">
            <p>© 2024 Government of Telangana. All Rights Reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,

  passwordChanged: (name) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1b5e20; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-box { background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Changed Successfully</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          
          <div class="success-box">
            <p><strong>Your password has been successfully changed.</strong></p>
          </div>
          
          <p>If you did not make this change, please contact the system administrator immediately.</p>
          
          <div class="footer">
            <p>© 2024 Government of Telangana. All Rights Reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('SMTP credentials not configured. Email not sent.');
      console.log('Email would be sent to:', to);
      console.log('Subject:', subject);
      return { success: true, message: 'Email service not configured (demo mode)' };
    }

    const mailOptions = {
      from: `"HOD Management System" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send registration success email
const sendRegistrationEmail = async (email, name, username, password) => {
  const subject = 'Registration Successful - HOD Management System';
  const html = emailTemplates.registrationSuccess(name, username, password);
  return await sendEmail(email, subject, html);
};

// Send forgot password OTP email
const sendForgotPasswordEmail = async (email, name, otp) => {
  const subject = 'Password Reset OTP - HOD Management System';
  const html = emailTemplates.forgotPasswordOTP(name, otp);
  return await sendEmail(email, subject, html);
};

// Send password changed notification
const sendPasswordChangedEmail = async (email, name) => {
  const subject = 'Password Changed - HOD Management System';
  const html = emailTemplates.passwordChanged(name);
  return await sendEmail(email, subject, html);
};

module.exports = {
  sendEmail,
  sendRegistrationEmail,
  sendForgotPasswordEmail,
  sendPasswordChangedEmail
};

