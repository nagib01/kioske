import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function stripQuotes(v: string | undefined): string | undefined {
  if (!v) return v;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = stripQuotes(process.env.SMTP_USER);
  const pass = stripQuotes(process.env.SMTP_PASS);

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

  const from = stripQuotes(process.env.SMTP_FROM) || stripQuotes(process.env.SMTP_USER) || 'noreply@escola.com';

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
