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
    instrutor VARCHAR(200),
    descricao TEXT,
    realizada BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_students_escola ON students (escola_id, ativo);
CREATE INDEX IF NOT EXISTS idx_students_nome ON students (nome);
CREATE INDEX IF NOT EXISTS idx_students_numero ON students (escola_id, numero_estudante);
CREATE INDEX IF NOT EXISTS idx_students_categoria ON students (categoria);
CREATE INDEX IF NOT EXISTS idx_students_estado ON students (estado_formacao);
CREATE INDEX IF NOT EXISTS idx_student_contacts_student ON student_contacts (student_id);
CREATE INDEX IF NOT EXISTS idx_training_records_student ON training_records (student_id, data DESC);

-- Add student_id to tickets for association
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS student_id BIGINT REFERENCES students(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_student ON tickets (student_id);
