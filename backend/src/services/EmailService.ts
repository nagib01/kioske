import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter: nodemailer.Transporter | null = null;

function stripQuotes(v: string | undefined): string | undefined {
  if (!v) return v;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = config.smtp.host;
  const port = config.smtp.port;
  const user = stripQuotes(config.smtp.user);
  const pass = stripQuotes(config.smtp.pass);

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;

  const from = stripQuotes(config.smtp.from) || stripQuotes(config.smtp.user) || 'noreply@escola.com';

  try {
    await t.sendMail({ from, to: params.to, subject: params.subject, text: params.text, html: params.html || params.text });
    return true;
  } catch (err) {
    console.error(`[Email] Falha ao enviar para ${params.to}:`, err);
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return !!getTransporter();
}
