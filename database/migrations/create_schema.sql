-- Tabela para armazenar os metadados dos backups do sistema
CREATE TABLE IF NOT EXISTS system_backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('auto', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
  size BIGINT DEFAULT 0,
  storage_path TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Tabela para eventos do sistema
CREATE TABLE IF NOT EXISTS system_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar pasta de storage para os backups se ainda não existir
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

-- Configurar políticas de acesso aos backups (usando a tabela profiles existente)
CREATE POLICY "Backups visíveis apenas para administradores" 
ON system_backups
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Permissões para acessar os arquivos de backup no storage (usando a tabela profiles existente)
CREATE POLICY "Arquivos de backup visíveis apenas para administradores" 
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'backups' AND
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Política para permitir inserção em system_backups
CREATE POLICY "Inserção de backups permitida para administradores"
ON system_backups
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Política para permitir atualização em system_backups
CREATE POLICY "Atualização de backups permitida para administradores"
ON system_backups
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Políticas para tabela system_config
CREATE POLICY "Configurações visíveis para administradores"
ON system_config
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Inserção de configurações permitida para administradores"
ON system_config
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Atualização de configurações permitida para administradores"
ON system_config
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Políticas para tabela system_events
CREATE POLICY "Eventos visíveis para administradores"
ON system_events
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Inserção de eventos permitida para administradores"
ON system_events
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);
