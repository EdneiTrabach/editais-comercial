-- Script CORRIGIDO para criar as tabelas de backup no Supabase

-- Vamos primeiro excluir as tabelas se elas existirem para recriá-las corretamente
DROP TABLE IF EXISTS system_backups;
DROP TABLE IF EXISTS system_config;

-- Tabela para armazenar os metadados dos backups do sistema
CREATE TABLE IF NOT EXISTS system_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('auto', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
  size BIGINT DEFAULT 0,
  storage_path TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE system_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Limpar políticas existentes para evitar duplicação
DROP POLICY IF EXISTS "Backups visíveis apenas para administradores" ON system_backups;
DROP POLICY IF EXISTS "Inserção de backups permitida para administradores" ON system_backups;
DROP POLICY IF EXISTS "Atualização de backups permitida para administradores" ON system_backups;
DROP POLICY IF EXISTS "Configurações visíveis para administradores" ON system_config;
DROP POLICY IF EXISTS "Inserção de configurações permitida para administradores" ON system_config;
DROP POLICY IF EXISTS "Atualização de configurações permitida para administradores" ON system_config;
DROP POLICY IF EXISTS "Arquivos de backup visíveis apenas para administradores" ON storage.objects;

-- Criar bucket de storage para os backups
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'backups'
  ) INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('backups', 'backups', FALSE);
  END IF;
END $$;

-- Configurar políticas de acesso
CREATE POLICY "Backups visíveis apenas para administradores" 
ON system_backups FOR SELECT
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Inserção de backups permitida para administradores"
ON system_backups FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Atualização de backups permitida para administradores"
ON system_backups FOR UPDATE
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Configurações visíveis para administradores"
ON system_config FOR SELECT
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Inserção de configurações permitida para administradores"
ON system_config FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Atualização de configurações permitida para administradores"
ON system_config FOR UPDATE
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Arquivos de backup visíveis apenas para administradores" 
ON storage.objects FOR SELECT
USING (bucket_id = 'backups' AND auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Configuração inicial de agendamento com horário correto
INSERT INTO system_config (key, value)
VALUES ('backup_agendamento', '{"frequencia":"diario","horario":"10:30","diasSemana":[],"diaMes":1,"ativo":true}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Configuração de backup concluída com sucesso!';
END $$;
