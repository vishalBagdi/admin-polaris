import nodemailer from "nodemailer";
import { MailtrapClient } from "mailtrap";

const getMailFrom = () => process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = port === 465;

  if (!host || !port || !user || !pass) {
    return null;
  }

  return { host, port, secure, auth: { user, pass } };
};

const sendViaSmtp = async ({ to, subject, text, html }) => {
  const from = getMailFrom();
  if (!from) {
    const error = new Error("SMTP_FROM or MAIL_FROM is not configured.");
    error.status = 500;
    throw error;
  }

  const smtpConfig = getSmtpConfig();
  if (!smtpConfig) {
    const error = new Error("SMTP is not configured.");
    error.status = 500;
    throw error;
  }

  const transporter = nodemailer.createTransport(smtpConfig);
  return transporter.sendMail({ from, to, subject, text, html });
};

const getMailtrapClient = () => {
  const token = process.env.MAILTRAP_API_TOKEN;
  if (!token) {
    const error = new Error("MAILTRAP_API_TOKEN is not configured.");
    error.status = 500;
    throw error;
  }
  return new MailtrapClient({ token });
};

const sendViaMailtrapApi = async ({ to, subject, text, html }) => {
  const fromEmail = getMailFrom();
  if (!fromEmail) {
    const error = new Error("MAIL_FROM is not configured.");
    error.status = 500;
    throw error;
  }

  const client = getMailtrapClient();
  return client.send({
    from: { email: fromEmail, name: process.env.MAIL_FROM_NAME || "Polaris" },
    to: [{ email: to }],
    subject,
    text,
    html,
    category: "Password Reset",
  });
};

const sendMail = async (payload) => {
  if (process.env.SMTP_HOST) {
    return sendViaSmtp(payload);
  }
  return sendViaMailtrapApi(payload);
};

export { sendMail };
