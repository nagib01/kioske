-- Clean up legacy tables and columns
ALTER TABLE tickets DROP COLUMN IF EXISTS documentos_ok;
DROP TABLE IF EXISTS regras_triagem;
