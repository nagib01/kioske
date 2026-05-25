import QRCode from 'qrcode';

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';

export async function gerarQRCode(alunoToken: string): Promise<string> {
  const url = `${FRONTEND_URL}/aluno?token=${alunoToken}`;
  return QRCode.toDataURL(url, { width: 200, margin: 2 });
}
