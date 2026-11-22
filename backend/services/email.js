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
//
// ONLINE (Render free plan blocks Gmail SMTP): use Brevo instead. It sends
// over normal HTTPS, free for 300 emails a day. Put these in Render:
//   BREVO_API_KEY=xkeysib-....
//   EMAIL_FROM="College Library <yourname@gmail.com>"   (a sender verified in Brevo)
// If BREVO_API_KEY is set it is used, otherwise SMTP is used.
const nodemailer = require("nodemailer");

let transporter = null;
let warned = false;

const useBrevo = () => !!process.env.BREVO_API_KEY;
const isEmailOn = () => useBrevo() || !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

// "College Library <me@gmail.com>" -> { name: "College Library", email: "me@gmail.com" }
const parseFrom = (from) => {
  const match = String(from || "").match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim() || "College Library", email: match[2].trim() };
  return { name: "College Library", email: String(from || "").trim() };
};

// Send through Brevo's HTTPS API (works on Render's free plan)
const sendWithBrevo = async ({ to, name, subject, text, html }) => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: parseFrom(process.env.EMAIL_FROM || process.env.SMTP_USER),
      to: [{ email: to, name: name || to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });
  if (!response.ok) throw new Error(`Brevo said ${response.status}: ${await response.text()}`);
};

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
      console.log("Email reminders are off (add BREVO_API_KEY or SMTP settings to .env to turn them on).");
      warned = true;
    }
    return false;
  }
  const email = {
    to,
    name,
    subject: `Library: ${title}`,
    text: `Hi ${name || "there"},\n\n${title}\n${message}\n\nOpen the Library app to see the details.`,
    html: buildHtml(name, title, message),
  };
  try {
    if (useBrevo()) {
      await sendWithBrevo(email);
    } else {
      await getTransporter().sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, ...email });
    }
    return true;
  } catch (error) {
    console.error(`Email to ${to} failed:`, error.message);
    return false;
  }
};

module.exports = { sendEmail, isEmailOn };
