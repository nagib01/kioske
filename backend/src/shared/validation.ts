import { z } from 'zod';
import { FastifyInstance } from 'fastify';

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    throw { statusCode: 400, body: { error: firstError.message, code: 'VALIDATION_ERROR', details: result.error.flatten() } };
  }
  return result.data;
}

export function addValidationHook<T>(fastify: FastifyInstance, schema: z.ZodSchema) {
  return async (request: any, reply: any) => {
    try {
      request.validatedBody = validate(schema, request.body);
    } catch (err: any) {
      return reply.status(err.statusCode || 400).send(err.body);
    }
  };
}

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

export const servicoIdSchema = z.object({
  servicoId: z.string().min(1, 'servicoId é obrigatório'),
});

export const ticketIdSchema = z.object({
  ticketId: z.string().min(1, 'ticketId é obrigatório'),
});

export const criarTicketManualSchema = z.object({
  servicoId: z.string().min(1, 'servicoId é obrigatório'),
  alunoNome: z.string().optional(),
  escolaId: z.string().optional(),
  studentId: z.string().optional(),
});

export const chamarTicketSchema = z.object({
  mesa: z.string().optional(),
  servicoId: z.string().optional(),
  escolaId: z.string().optional(),
});

export const transferirTicketSchema = z.object({
  mesa: z.string().min(1, 'mesa é obrigatório'),
});

export const criarServicoSchema = z.object({
  nome: z.string().min(1, 'nome é obrigatório'),
  prioridade_base: z.number().optional(),
  codigo_prefixo: z.string().optional(),
  tempo_medio_atendimento: z.number().optional(),
  mesa_padrao: z.string().optional(),
});

export const criarPerguntaSchema = z.object({
  servico_id: z.string().optional(),
  texto: z.string().min(1, 'texto é obrigatório'),
  tipo: z.enum(['yes_no', 'single_choice']).optional(),
  obrigatoria: z.boolean().optional(),
  ordem: z.number().optional(),
  opcoes: z.array(z.object({
    label: z.string().min(1),
    value: z.string().min(1),
    ordem: z.number().optional(),
  })).optional(),
});

export const criarOpcaoSchema = z.object({
  question_id: z.string().min(1, 'question_id é obrigatório'),
  label: z.string().min(1, 'label é obrigatório'),
  value: z.string().min(1, 'value é obrigatório'),
  ordem: z.number().optional(),
  regra: z.any().optional(),
});

// Student schemas
export const criarAlunoSchema = z.object({
  numero_estudante: z.string().min(1, 'Número de estudante é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  data_nascimento: z.string().optional(),
  documento_identificacao: z.string().optional(),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  estado_formacao: z.string().optional(),
  data_matricula: z.string().optional(),
  observacoes: z.string().optional(),
});

export const atualizarAlunoSchema = criarAlunoSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export const contactoAlunoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  parentesco: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

export const aulaAlunoSchema = z.object({
  tipo: z.enum(['teorica', 'pratica']),
  data: z.string().min(1, 'Data é obrigatória'),
  hora_inicio: z.string().optional(),
  hora_fim: z.string().optional(),
  instrutor: z.string().optional(),
  descricao: z.string().optional(),
  realizada: z.boolean().optional(),
});

export const associarTicketSchema = z.object({
  ticketId: z.string().min(1, 'ticketId é obrigatório'),
});

// ─── Lesson Schemas ───
export const lessonSchema = z.object({
    student_id: z.string().min(1, 'Aluno é obrigatório'),
    tipo: z.enum(['teorica', 'pratica']),
    data: z.string().min(1, 'Data é obrigatória'),
    hora_inicio: z.string().min(1, 'Hora de início é obrigatória'),
    hora_fim: z.string().min(1, 'Hora de fim é obrigatória'),
    car_id: z.string().optional(),
    summary: z.string().optional(),
    status: z.enum(['agendada', 'em_curso', 'concluida', 'cancelada']).optional(),
});

export const lessonUpdateSchema = z.object({
    student_id: z.string().min(1, 'Aluno é obrigatório').optional(),
    tipo: z.enum(['teorica', 'pratica']).optional(),
    data: z.string().optional(),
    hora_inicio: z.string().optional(),
    hora_fim: z.string().optional(),
    car_id: z.string().optional(),
    summary: z.string().optional(),
    status: z.enum(['agendada', 'em_curso', 'concluida', 'cancelada']).optional(),
});

// ─── Car Schemas ───
export const carSchema = z.object({
    matricula: z.string().min(1, 'Matrícula é obrigatória'),
    marca: z.string().min(1, 'Marca é obrigatória'),
    modelo: z.string().min(1, 'Modelo é obrigatório'),
    ano: z.number().int().optional(),
    categoria: z.string().min(1, 'Categoria é obrigatória'),
    observacoes: z.string().optional(),
});

export const carUpdateSchema = carSchema.partial().extend({
  ativo: z.boolean().optional(),
});

// ─── Student Auth Schemas ───
export const studentLoginEmailSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

export const studentLoginNifSchema = z.object({
  numero_estudante: z.string().min(1, 'Nº de estudante é obrigatório'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
});

export const studentLoginQrSchema = z.object({
  qrToken: z.string().min(1, 'QR token é obrigatório'),
});

export const studentRefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const studentQuickKioskSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  escolaId: z.string().optional(),
  telefone: z.string().optional(),
});

export const studentChangePasswordSchema = z.object({
  senha_atual: z.string().min(1, 'Senha atual é obrigatória'),
  nova_senha: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
});

// ─── User / Instructor Schemas ───
export const createUserSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'recepcionista', 'instructor']),
  telefone: z.string().optional().or(z.literal('')),
});

export const updateUserSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(['admin', 'recepcionista', 'instructor']).optional(),
  telefone: z.string().optional().or(z.literal('')),
  ativo: z.boolean().optional(),
});
