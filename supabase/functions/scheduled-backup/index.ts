import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  try {
    // Verificar se é uma requisição autorizada (você pode adicionar mais segurança)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Criar cliente Supabase com a chave de serviço para ter permissões completas
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Iniciar registro do backup no banco
    const { data: backupRecord, error: insertError } = await supabase
      .from('system_backups')
      .insert({
        tipo: 'auto',
        status: 'in_progress',
        filename: `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Erro ao registrar backup: ${insertError.message}`)
    }

    // Executar o backup das tabelas principais
    const tables = [
      // Usuários e perfis
      'auth.users',
      'profiles',
      
      // Empresas e representantes
      'empresas',
      'representantes',
      
      // Plataformas e relacionamentos
      'plataformas',
      'empresa_plataforma',
      'empresa_plataforma_dados',
      
      // Editais e processos
      'editais',
      'responsaveis_processos',
      'reunioes',
      
      // Setores e sistemas
      'setores',
      'sistemas',
      
      // Configurações e análises
      'configuracoes',
      'analises_ia',
      
      // Notificações
      'notifications',
      'notification_recipients',
      
      // Atualizações do sistema
      'system_updates',
      'system_update_reads',
      
      // Configurações do sistema
      'system_config',
      'system_events',
      
      // Tabela de Backups (meta-backup)
      'system_backups'
    ]

    // Armazenar os dados de cada tabela
    const backupData = {}
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
      
      if (error) throw new Error(`Erro ao fazer backup da tabela ${table}: ${error.message}`)
      
      backupData[table] = data
    }

    // Transformar os dados em formato SQL ou JSON
    const backupContent = JSON.stringify(backupData, null, 2)
    const backupSize = new TextEncoder().encode(backupContent).length

    // Enviar o arquivo para o storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('backups')
      .upload(backupRecord.filename, backupContent, {
        contentType: 'application/json',
        cacheControl: '3600'
      })

    if (storageError) {
      // Atualizar o status para falha
      await supabase
        .from('system_backups')
        .update({ 
          status: 'failed',
          error_message: storageError.message 
        })
        .eq('id', backupRecord.id)
      
      throw new Error(`Erro ao armazenar backup: ${storageError.message}`)
    }

    // Atualizar o registro do backup com status completo e tamanho
    const { error: updateError } = await supabase
      .from('system_backups')
      .update({ 
        status: 'completed',
        size: backupSize,
        storage_path: storageData.path
      })
      .eq('id', backupRecord.id)

    if (updateError) {
      throw new Error(`Erro ao atualizar status do backup: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Backup realizado com sucesso', 
        backupId: backupRecord.id 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro no processo de backup:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
