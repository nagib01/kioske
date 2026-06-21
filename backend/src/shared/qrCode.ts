import QRCode from 'qrcode';
import { config } from '../config.js';

export async function gerarQRCode(alunoToken: string): Promise<string> {
  const url = `${config.qrFrontendUrl}/aluno?token=${alunoToken}`;
  return QRCode.toDataURL(url, { width: 200, margin: 2 });
}
