const nodemailer = require('nodemailer');

/**
 * Professional Email Utility for E-Library
 * Supports: Welcome Emails, Password Reset Tokens
 */
const sendEmail = async (options) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_USER or EMAIL_PASS is missing in environment variables!');
    throw new Error('Email configuration missing');
  }

  // 1) Create a transporter
  // We use a direct SMTP configuration which is more reliable than the "service" alias on cloud platforms
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // Default to false (587)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Do not fail on invalid certs (common issue with some SMTP proxies)
      rejectUnauthorized: false
    }
  });

  // Verify connection configuration
  try {
    console.log(`📡 Attempting SMTP connection to ${process.env.EMAIL_HOST || 'smtp.gmail.com'} on port ${process.env.EMAIL_PORT || 587}...`);
    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP Verification Timeout (20s)')), 20000))
    ]);
    console.log('✅ SMTP Transporter Verified');
  } catch (err) {
    console.warn('⚠️ SMTP Verification warning (attempting send anyway):', err.message);
    // We don't throw here to allow a direct send attempt, which sometimes works even if verify() fails on cloud runners
  }

  // 2) Define the email options
  const mailOptions = {
    from: `"E-Library Support" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message || options.text || 'Verification Code',
    html: options.html,
  };

  // 3) Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully: %s', info.messageId);
    return info;
  } catch (err) {
    console.error('❌ SendMail Error:', err.message);
    throw err;
  }
};

module.exports = sendEmail;

