import { describe, it, expect } from 'vitest';
import { loginSchema, criarTicketManualSchema } from './validation.js';
describe('🛡️ Testes Unitários de Validação (Zod)', () => {

  // Teste que valida os dados do login
  it('Aceitar um login com email e senha corretos', () => {
    const dadosValidos = { email: 'aluno@escola.pt', senha: 'senhaSegura123' };
    const resultado = loginSchema.safeParse(dadosValidos);
    
    expect(resultado.success).toBe(true);
  });

  // Teste que valida se o login bloqueia emails errados
  it('Deve rejeitar um login se o email for inválido', () => {
    const dadosInvalidos = { email: 'email-sem-arroba.com', senha: '123' };
    const resultado = loginSchema.safeParse(dadosInvalidos);
    
    expect(resultado.success).toBe(false);
  });

  // Teste que valida a criação de senhas
  it('Vai rejeitar a criação da senha se o servicoId estiver em falta', () => {
    const dadosInvalidos = { alunoNome: 'Carlos' }; // Falta o servicoId, que é obrigatório
    const resultado = criarTicketManualSchema.safeParse(dadosInvalidos);    
    expect(resultado.success).toBe(false);
  });
});