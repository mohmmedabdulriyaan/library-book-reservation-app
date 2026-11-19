// Email reminders using Nodemailer.
// Emails are OPTIONAL: if SMTP settings are not in .env, the app works
// normally and simply skips sending emails.
//
// For Gmail: turn on 2-step verification, create an "App password",
// then put these in backend/.env:
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=465
//   SMTP_USER=yourname@gmail.com
//   SMTP_PASS=your16letterapppassword
//   EMAIL_FROM="College Library <yourname@gmail.com>"
const nodemailer = require("nodemailer");

let transporter = null;
let warned = false;

const isEmailOn = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

// Simple branded email layout
const buildHtml = (name, title, message) => `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#6d5dfc,#4f7cff);color:#fff;padding:18px 22px;font-size:18px;font-weight:bold">
      College Library
    </div>
    <div style="padding:22px;color:#111827">
      <p style="margin:0 0 12px">Hi ${name || "there"},</p>
      <h2 style="font-size:17px;margin:0 0 8px">${title}</h2>
      <p style="margin:0 0 16px;line-height:1.5">${message}</p>
      <p style="margin:0;color:#6b7280;font-size:13px">Open the Library app to see the details.</p>
    </div>
  </div>`;

// Sends one email. Never throws: a failed email must not break the app.
const sendEmail = async (to, name, title, message) => {
  if (!to) return false;
  if (!isEmailOn()) {
    if (!warned) {
      console.log("Email reminders are off (add SMTP settings to .env to turn them on).");
      warned = true;
    }
    return false;
  }
  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: `Library: ${title}`,
      text: `Hi ${name || "there"},\n\n${title}\n${message}\n\nOpen the Library app to see the details.`,
      html: buildHtml(name, title, message),
    });
    return true;
  } catch (error) {
    console.error(`Email to ${to} failed:`, error.message);
    return false;
  }
};

module.exports = { sendEmail, isEmailOn };
