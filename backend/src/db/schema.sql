-- Tabela escolas
CREATE TABLE IF NOT EXISTS escolas (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela serviços (dinâmica, criada/gerida pelo admin)
CREATE TABLE IF NOT EXISTS servicos (
    id BIGSERIAL PRIMARY KEY,
    escola_id BIGINT NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    codigo_prefixo VARCHAR(5) NOT NULL DEFAULT 'A',
    proximo_numero INT NOT NULL DEFAULT 1,
    tempo_medio_atendimento INT NOT NULL DEFAULT 10,
    prioridade_base INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    mesa_padrao VARCHAR(10) NOT NULL DEFAULT '01',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela tickets (fila)
CREATE TABLE IF NOT EXISTS tickets (
    id BIGSERIAL PRIMARY KEY,
    escola_id BIGINT NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    servico_id BIGINT NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
    codigo_senha VARCHAR(20),
    posicao INT NOT NULL DEFAULT 0,
    priority BOOLEAN DEFAULT FALSE,
    priority_level INT NOT NULL DEFAULT 0, -- 0=normal, 1=medium, 2=urgent
    documentos_ok BOOLEAN DEFAULT TRUE,
    alertas JSONB NOT NULL DEFAULT '[]'::jsonb,
    triagem_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'waiting', -- waiting, called, finished
    aluno_token UUID DEFAULT gen_random_uuid(),
    aluno_nome VARCHAR(200),
    mesa_atendimento VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de regras de triagem (opcional para futuro)
CREATE TABLE IF NOT EXISTS regras_triagem (
    id BIGSERIAL PRIMARY KEY,
    pergunta TEXT NOT NULL,
    opcoes JSONB,
    condicao JSONB,
    acao JSONB
);

-- Perguntas dinâmicas de triagem (globais da escola ou associadas a um serviço)
CREATE TABLE IF NOT EXISTS triage_questions (
    id BIGSERIAL PRIMARY KEY,
    escola_id BIGINT NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    servico_id BIGINT REFERENCES servicos(id) ON DELETE CASCADE,
    chave VARCHAR(100), -- ex: atividade_em_minutos, exame_hora_marcada, documentacao_completa
    texto TEXT NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'single_choice', -- yes_no | single_choice
    obrigatoria BOOLEAN NOT NULL DEFAULT TRUE,
    ordem INT NOT NULL DEFAULT 0,
    regras JSONB NOT NULL DEFAULT '[]'::jsonb,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS triage_question_options (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES triage_questions(id) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL,
    value VARCHAR(100) NOT NULL,
    ordem INT NOT NULL DEFAULT 0,
    regra JSONB DEFAULT '{}', -- {"priority_level": 2} ou {"alerta": "documento_faltando"} ou {"priority_level": 1, "alerta": "hora_marcada"}
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_triage_answers (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    question_id BIGINT REFERENCES triage_questions(id) ON DELETE SET NULL,
    question_text TEXT,
    answer_value TEXT,
    answer_label TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE escolas ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE servicos ADD COLUMN IF NOT EXISTS codigo_prefixo VARCHAR(5) NOT NULL DEFAULT 'A';
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS proximo_numero INT NOT NULL DEFAULT 1;
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS tempo_medio_atendimento INT NOT NULL DEFAULT 10;
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS prioridade_base INT DEFAULT 0;
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS mesa_padrao VARCHAR(10) NOT NULL DEFAULT '01';
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS codigo_senha VARCHAR(20);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS priority_level INT NOT NULL DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS alertas JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS triagem_at TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS aluno_nome VARCHAR(200);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS mesa_atendimento VARCHAR(10);

ALTER TABLE triage_question_options ADD COLUMN IF NOT EXISTS regra JSONB DEFAULT '{}';

-- Indexes for queue performance
CREATE INDEX IF NOT EXISTS idx_tickets_queue_escola ON tickets (escola_id, status, priority_level DESC NULLS LAST, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_tickets_queue_servico ON tickets (servico_id, status, priority_level DESC NULLS LAST, created_at ASC);

-- Tabela de auditoria para ações críticas
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    acao VARCHAR(50) NOT NULL,
    utilizador_id BIGINT,
    utilizador_nome VARCHAR(200),
    ticket_id BIGINT,
    detalhes JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_acao ON audit_log (acao, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_ticket ON audit_log (ticket_id);

-- Tabela de utilizadores (admins, recepcionistas, instrutores, etc.)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE,
    senha_hash VARCHAR(200),
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- admin, recepcionista, instructor, user
    avatar_url TEXT,
    escola_id BIGINT REFERENCES escolas(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de viaturas (carros da escola)
CREATE TABLE IF NOT EXISTS cars (
    id BIGSERIAL PRIMARY KEY,
    escola_id BIGINT NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    matricula VARCHAR(20) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    ano INT,
    categoria VARCHAR(10) NOT NULL,
    observacoes TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(escola_id, matricula)
);

-- ============================================================
-- Squished from migrations (001_cleanup_legacy, 002_create_students, 003_student_auth)
-- ============================================================

-- Clean up legacy tables and columns
ALTER TABLE tickets DROP COLUMN IF EXISTS documentos_ok;
DROP TABLE IF EXISTS regras_triagem;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    escola_id BIGINT NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    numero_estudante VARCHAR(50) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    telefone VARCHAR(50),
    endereco TEXT,
    data_nascimento DATE,
    documento_identificacao VARCHAR(50),
    categoria VARCHAR(10) NOT NULL DEFAULT 'B',
    estado_formacao VARCHAR(30) NOT NULL DEFAULT 'inscrito',
    data_matricula DATE DEFAULT CURRENT_DATE,
    observacoes TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(escola_id, numero_estudante)
);

CREATE TABLE IF NOT EXISTS student_contacts (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    parentesco VARCHAR(50),
    telefone VARCHAR(50),
    email VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_records (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL DEFAULT 'pratica',
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_inicio TIME,
    hora_fim TIME,
    car_id BIGINT REFERENCES cars(id) ON DELETE SET NULL,
    instructor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    summary TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'agendada',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Migrate existing data (safe to run repeatedly)
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS car_id BIGINT REFERENCES cars(id) ON DELETE SET NULL;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS instructor_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS summary TEXT;
UPDATE training_records SET summary = descricao WHERE summary IS NULL AND descricao IS NOT NULL;
ALTER TABLE training_records ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'agendada';
UPDATE training_records SET status = CASE WHEN realizada = true THEN 'concluida' ELSE 'agendada' END WHERE status = 'agendada';
ALTER TABLE training_records DROP COLUMN IF EXISTS instrutor;
ALTER TABLE training_records DROP COLUMN IF EXISTS descricao;
ALTER TABLE training_records DROP COLUMN IF EXISTS realizada;

CREATE INDEX IF NOT EXISTS idx_students_escola ON students (escola_id, ativo);
CREATE INDEX IF NOT EXISTS idx_students_nome ON students (nome);
CREATE INDEX IF NOT EXISTS idx_students_numero ON students (escola_id, numero_estudante);
CREATE INDEX IF NOT EXISTS idx_students_categoria ON students (categoria);
CREATE INDEX IF NOT EXISTS idx_students_estado ON students (estado_formacao);
CREATE INDEX IF NOT EXISTS idx_student_contacts_student ON student_contacts (student_id);
CREATE INDEX IF NOT EXISTS idx_training_records_student ON training_records (student_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_training_records_instructor ON training_records (instructor_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_training_records_status ON training_records (status);
CREATE INDEX IF NOT EXISTS idx_cars_escola ON cars (escola_id, ativo);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS student_id BIGINT REFERENCES students(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_student ON tickets (student_id);

-- Student auth
ALTER TABLE students ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(200);
ALTER TABLE students ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS student_sessions (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_sessions_token ON student_sessions (refresh_token);
CREATE INDEX IF NOT EXISTS idx_student_sessions_student ON student_sessions (student_id);

CREATE TABLE IF NOT EXISTS student_qr_tokens (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    qr_token VARCHAR(200) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_qr_tokens_token ON student_qr_tokens (qr_token);
CREATE INDEX IF NOT EXISTS idx_student_qr_tokens_student ON student_qr_tokens (student_id);

CREATE TABLE IF NOT EXISTS student_login_history (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    metodo VARCHAR(30) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    sucesso BOOLEAN NOT NULL DEFAULT TRUE,
    falha_motivo VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_login_history_student ON student_login_history (student_id, created_at DESC);

ALTER TABLE students ADD COLUMN IF NOT EXISTS login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Notificações para alunos
CREATE TABLE IF NOT EXISTS student_notifications (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL, -- nova_aula, aula_alterada, aula_cancelada
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT,
    lesson_id BIGINT REFERENCES training_records(id) ON DELETE SET NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_notifications_student ON student_notifications (student_id, lida, created_at DESC);

ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role, ativo);