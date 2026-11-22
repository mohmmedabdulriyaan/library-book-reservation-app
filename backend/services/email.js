// Emails (welcome, due-soon, overdue, waitlist, important notices) using Brevo.
// Brevo sends over normal HTTPS, so it works on Render's free plan.
// Free plan: 300 emails a day.
//
// Emails are OPTIONAL: without these settings the app works normally and
// simply skips sending emails. Put them in backend/.env (laptop) and in
// Render > Environment (online):
//   BREVO_API_KEY=xkeysib-....
//   EMAIL_FROM="College Library <yourname@gmail.com>"   (a sender verified in Brevo)

let warned = false;

const isEmailOn = () => !!(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);

// "College Library <me@gmail.com>" -> { name: "College Library", email: "me@gmail.com" }
const parseFrom = (from) => {
  const match = String(from || "").match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim() || "College Library", email: match[2].trim() };
  return { name: "College Library", email: String(from || "").trim() };
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
      console.log("Emails are off (add BREVO_API_KEY and EMAIL_FROM to turn them on).");
      warned = true;
    }
    return false;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: parseFrom(process.env.EMAIL_FROM),
        to: [{ email: to, name: name || to }],
        subject: `Library: ${title}`,
        textContent: `Hi ${name || "there"},\n\n${title}\n${message}\n\nOpen the Library app to see the details.`,
        htmlContent: buildHtml(name, title, message),
      }),
    });
    if (!response.ok) throw new Error(`Brevo said ${response.status}: ${await response.text()}`);
    return true;
  } catch (error) {
    console.error(`Email to ${to} failed:`, error.message);
    return false;
  }
};

module.exports = { sendEmail, isEmailOn };
