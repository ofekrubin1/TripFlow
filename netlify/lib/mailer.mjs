import nodemailer from 'nodemailer';

// Sends through a Gmail account using an app password (Netlify env vars GMAIL_USER, GMAIL_APP_PASSWORD).
export async function sendMail({ to, subject, html, text }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('Email is not configured: set GMAIL_USER and GMAIL_APP_PASSWORD in Netlify environment variables.');
  const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass: pass.replace(/\s+/g, '') } });
  await transport.sendMail({ from: `"TripFlow" <${user}>`, to, subject, html, text });
}
