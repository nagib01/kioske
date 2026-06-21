// Central domain types. These are the canonical shapes; pages/components should
// import from here instead of re-declaring inline interfaces. Adoption is
// incremental (see REFACTOR_PLAN) — existing inline types are migrated as each
// file is touched.

export type UUID = string;

export interface Servico {
  id: UUID;
  nome: string;
  descricao?: string;
  icone?: string;
  ativo?: boolean;
  ordem?: number;
  mesas?: string[];
}

export type TicketEstado =
  | 'aguardando'
  | 'chamado'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado'
  | string;

export interface Ticket {
  id: UUID;
  numero: string;
  servico_id?: UUID;
  servico_nome?: string;
  estado: TicketEstado;
  prioridade?: number | string;
  mesa?: string;
  aluno_token?: string;
  aluno_nome?: string;
  criado_em?: string;
  chamado_em?: string;
  concluido_em?: string;
}

export interface Student {
  id: UUID;
  nome: string;
  email?: string;
  telefone?: string;
  numero_estudante?: string;
  categoria?: string;
  estado?: string;
  criado_em?: string;
}

export type LessonTipo = 'pratica' | 'teorica' | string;

export interface Lesson {
  id: UUID;
  student_id?: UUID;
  student_nome?: string;
  instructor_id?: UUID;
  instructor_nome?: string;
  car_id?: UUID;
  tipo: LessonTipo;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  categoria?: string;
  summary?: string;
  estado?: string;
}

export interface Car {
  id: UUID;
  matricula: string;
  marca?: string;
  modelo?: string;
  categoria?: string;
  ativo?: boolean;
}

export type UserRole = 'admin' | 'recepcionista' | 'instructor' | string;

export interface User {
  id: UUID;
  nome: string;
  email: string;
  role: UserRole;
  escola_id?: UUID;
  avatar_url?: string;
}

export interface QueueStats {
  aguardando?: number;
  em_atendimento?: number;
  concluido_hoje?: number;
  tempo_medio?: number;
}
