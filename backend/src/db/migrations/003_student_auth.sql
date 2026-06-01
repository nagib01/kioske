-- ============================================================
-- Student authentication system
-- Tables: student_sessions, student_qr_tokens, student_login_history
-- Columns: students.senha_hash, students.email_verified_at
-- ============================================================

-- 1. Add password hash and email verification to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(200);
ALTER TABLE students ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- 2. Student sessions (refresh tokens)
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

-- 3. Student QR code login tokens
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

-- 4. Student login history
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

-- 5. Add login attempt tracking for brute force protection
ALTER TABLE students ADD COLUMN IF NOT EXISTS login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
