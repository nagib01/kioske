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

-- Tabela de utilizadores (admins, recepcionistas, etc.)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE,
    senha_hash VARCHAR(200),
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- admin, recepcionista, user
    avatar_url TEXT,
    escola_id BIGINT REFERENCES escolas(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);