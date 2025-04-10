| table_schema | table_name                  | column_name                | data_type                | is_nullable | column_default                                 |
| ------------ | --------------------------- | -------------------------- | ------------------------ | ----------- | ---------------------------------------------- |
| public       | analises_ia                 | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | analises_ia                 | texto_publicacao           | text                     | NO          | null                                           |
| public       | analises_ia                 | dados_extraidos            | jsonb                    | NO          | null                                           |
| public       | analises_ia                 | modelo                     | character varying        | NO          | null                                           |
| public       | analises_ia                 | timestamp                  | timestamp with time zone | NO          | null                                           |
| public       | analises_ia                 | validado                   | boolean                  | YES         | false                                          |
| public       | analises_ia                 | validacao_correta          | boolean                  | YES         | null                                           |
| public       | analises_ia                 | correcoes                  | jsonb                    | YES         | null                                           |
| public       | analises_ia                 | feedback_timestamp         | timestamp with time zone | YES         | null                                           |
| public       | analises_ia                 | confianca                  | integer                  | YES         | null                                           |
| public       | analises_ia_feedback        | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | analises_ia_feedback        | analise_id                 | uuid                     | YES         | null                                           |
| public       | analises_ia_feedback        | correto                    | boolean                  | NO          | null                                           |
| public       | analises_ia_feedback        | correcoes                  | jsonb                    | YES         | null                                           |
| public       | analises_ia_feedback        | timestamp                  | timestamp with time zone | NO          | null                                           |
| public       | analises_ia_feedback        | modelo                     | character varying        | YES         | null                                           |
| public       | analises_itens              | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | analises_itens              | processo_id                | uuid                     | YES         | null                                           |
| public       | analises_itens              | sistema_id                 | uuid                     | YES         | null                                           |
| public       | analises_itens              | total_itens                | integer                  | YES         | 0                                              |
| public       | analises_itens              | nao_atendidos              | integer                  | YES         | 0                                              |
| public       | analises_itens              | obrigatorio                | boolean                  | YES         | false                                          |
| public       | analises_itens              | percentual_minimo          | integer                  | YES         | null                                           |
| public       | analises_itens              | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | analises_itens              | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | analises_itens              | nome_sistema_temp          | text                     | YES         | null                                           |
| public       | analises_itens              | eh_anotacao                | boolean                  | YES         | false                                          |
| public       | analises_itens              | titulo_analise_avulsa      | text                     | YES         | null                                           |
| public       | analises_itens              | eh_analise_avulsa          | boolean                  | YES         | false                                          |
| public       | analises_itens              | descricao_analise_avulsa   | text                     | YES         | null                                           |
| public       | analises_itens              | numero_processo_analise    | text                     | YES         | null                                           |
| public       | analises_itens              | codigo_gpi_analise         | text                     | YES         | null                                           |
| public       | analises_itens              | orgao_analise              | text                     | YES         | null                                           |
| public       | analises_itens              | data_pregao_analise        | date                     | YES         | null                                           |
| public       | analises_itens              | hora_pregao_analise        | text                     | YES         | null                                           |
| public       | analises_itens              | objeto_analise             | text                     | YES         | null                                           |
| public       | analises_itens              | prazo_analise              | date                     | YES         | null                                           |
| public       | analises_itens              | analise_id                 | uuid                     | YES         | null                                           |
| public       | analises_itens              | sistema_nome_personalizado | text                     | YES         | null                                           |
| public       | analises_itens              | is_custom_line             | boolean                  | YES         | false                                          |
| public       | configuracoes               | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | configuracoes               | chave                      | character varying        | NO          | null                                           |
| public       | configuracoes               | valor                      | text                     | YES         | null                                           |
| public       | configuracoes               | descricao                  | text                     | YES         | null                                           |
| public       | configuracoes               | tipo                       | character varying        | YES         | null                                           |
| public       | configuracoes               | ultima_atualizacao         | timestamp with time zone | NO          | null                                           |
| public       | editais                     | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | editais                     | titulo                     | text                     | NO          | null                                           |
| public       | editais                     | descricao                  | text                     | YES         | null                                           |
| public       | editais                     | empresa                    | text                     | YES         | null                                           |
| public       | editais                     | valor                      | numeric                  | YES         | null                                           |
| public       | editais                     | data_limite                | timestamp with time zone | YES         | null                                           |
| public       | editais                     | status                     | text                     | YES         | 'ABERTO'::text                                 |
| public       | editais                     | responsavel_id             | uuid                     | YES         | null                                           |
| public       | editais                     | created_at                 | timestamp with time zone | NO          | timezone('utc'::text, now())                   |
| public       | editais                     | updated_at                 | timestamp with time zone | NO          | timezone('utc'::text, now())                   |
| public       | empresa_plataforma          | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | empresa_plataforma          | empresa_id                 | uuid                     | YES         | null                                           |
| public       | empresa_plataforma          | plataforma_id              | uuid                     | YES         | null                                           |
| public       | empresa_plataforma          | data_cadastro              | timestamp with time zone | YES         | now()                                          |
| public       | empresa_plataforma_dados    | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | empresa_plataforma_dados    | empresa_id                 | uuid                     | YES         | null                                           |
| public       | empresa_plataforma_dados    | plataforma_id              | uuid                     | YES         | null                                           |
| public       | empresa_plataforma_dados    | login                      | character varying        | YES         | null                                           |
| public       | empresa_plataforma_dados    | senha                      | character varying        | YES         | null                                           |
| public       | empresa_plataforma_dados    | data_validade              | date                     | YES         | null                                           |
| public       | empresa_plataforma_dados    | observacoes                | text                     | YES         | null                                           |
| public       | empresa_plataforma_dados    | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | empresa_plataforma_dados    | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | empresa_plataforma_dados    | responsavel_id             | uuid                     | YES         | null                                           |
| public       | empresas                    | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | empresas                    | nome                       | text                     | NO          | null                                           |
| public       | empresas                    | cnpj                       | text                     | NO          | null                                           |
| public       | empresas                    | razao_social               | text                     | NO          | null                                           |
| public       | empresas                    | contato                    | text                     | YES         | null                                           |
| public       | empresas                    | telefone                   | text                     | YES         | null                                           |
| public       | empresas                    | email                      | text                     | YES         | null                                           |
| public       | empresas                    | created_at                 | timestamp with time zone | NO          | timezone('utc'::text, now())                   |
| public       | empresas                    | updated_at                 | timestamp with time zone | NO          | timezone('utc'::text, now())                   |
| public       | empresas                    | color                      | character varying        | YES         | '#FFFFFF'::character varying                   |
| public       | empresas_concorrentes       | id                         | uuid                     | NO          | gen_random_uuid()                              |
| public       | empresas_concorrentes       | processo_id                | uuid                     | YES         | null                                           |
| public       | empresas_concorrentes       | nome                       | character varying        | NO          | null                                           |
| public       | empresas_concorrentes       | cnpj                       | character varying        | YES         | null                                           |
| public       | empresas_concorrentes       | contato_nome               | character varying        | YES         | null                                           |
| public       | empresas_concorrentes       | contato_email              | character varying        | YES         | null                                           |
| public       | empresas_concorrentes       | contato_telefone           | character varying        | YES         | null                                           |
| public       | empresas_concorrentes       | website                    | character varying        | YES         | null                                           |
| public       | empresas_concorrentes       | observacoes                | text                     | YES         | null                                           |
| public       | empresas_concorrentes       | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | empresas_concorrentes       | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | empresas_concorrentes       | created_by                 | uuid                     | YES         | null                                           |
| public       | empresas_concorrentes       | updated_by                 | uuid                     | YES         | null                                           |
| public       | extractions                 | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | extractions                 | texto_original             | text                     | NO          | null                                           |
| public       | extractions                 | tipo                       | text                     | NO          | null                                           |
| public       | extractions                 | dados_extraidos            | jsonb                    | NO          | null                                           |
| public       | extractions                 | timestamp                  | timestamp with time zone | NO          | null                                           |
| public       | extractions                 | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | extractions_feedback        | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | extractions_feedback        | extraction_id              | uuid                     | YES         | null                                           |
| public       | extractions_feedback        | dados_corrigidos           | jsonb                    | NO          | null                                           |
| public       | extractions_feedback        | timestamp                  | timestamp with time zone | NO          | null                                           |
| public       | extractions_feedback        | usuario_id                 | uuid                     | YES         | null                                           |
| public       | extractions_feedback        | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | extractions_learning        | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | extractions_learning        | original_text              | text                     | NO          | null                                           |
| public       | extractions_learning        | extracted_data             | jsonb                    | NO          | null                                           |
| public       | extractions_learning        | corrected_data             | jsonb                    | YES         | null                                           |
| public       | extractions_learning        | confidence_score           | double precision         | YES         | null                                           |
| public       | extractions_learning        | is_validated               | boolean                  | YES         | false                                          |
| public       | extractions_learning        | created_at                 | timestamp with time zone | YES         | timezone('utc'::text, now())                   |
| public       | extractions_learning        | updated_at                 | timestamp with time zone | YES         | timezone('utc'::text, now())                   |
| public       | feedback_analises           | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | feedback_analises           | analise_id                 | uuid                     | NO          | null                                           |
| public       | feedback_analises           | correto                    | boolean                  | NO          | null                                           |
| public       | feedback_analises           | correcoes                  | jsonb                    | YES         | null                                           |
| public       | feedback_analises           | usuario_id                 | uuid                     | YES         | null                                           |
| public       | feedback_analises           | criado_em                  | timestamp with time zone | YES         | now()                                          |
| public       | notification_recipients     | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | notification_recipients     | notification_id            | uuid                     | YES         | null                                           |
| public       | notification_recipients     | user_id                    | uuid                     | YES         | null                                           |
| public       | notification_recipients     | read                       | boolean                  | YES         | false                                          |
| public       | notification_recipients     | read_at                    | timestamp with time zone | YES         | null                                           |
| public       | notification_schedules      | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | notification_schedules      | processo_id                | uuid                     | YES         | null                                           |
| public       | notification_schedules      | status                     | text                     | YES         | null                                           |
| public       | notification_schedules      | message                    | text                     | YES         | null                                           |
| public       | notification_schedules      | next_notification          | timestamp with time zone | YES         | null                                           |
| public       | notification_schedules      | last_updated               | timestamp with time zone | YES         | null                                           |
| public       | notification_schedules      | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | notification_schedules      | active                     | boolean                  | YES         | true                                           |
| public       | notification_schedules      | mensagem                   | text                     | YES         | null                                           |
| public       | notification_schedules      | data_notificacao           | timestamp with time zone | YES         | null                                           |
| public       | notification_schedules      | tipo                       | character varying        | YES         | null                                           |
| public       | notifications               | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | notifications               | processo_id                | uuid                     | YES         | null                                           |
| public       | notifications               | title                      | text                     | NO          | null                                           |
| public       | notifications               | message                    | text                     | NO          | null                                           |
| public       | notifications               | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | notifications               | sender_id                  | uuid                     | YES         | null                                           |
| public       | notifications               | resolved                   | boolean                  | YES         | false                                          |
| public       | notifications               | resolved_at                | timestamp with time zone | YES         | null                                           |
| public       | notifications               | resolved_by                | uuid                     | YES         | null                                           |
| public       | notifications               | observation                | text                     | YES         | null                                           |
| public       | notifications               | tipo                       | text                     | NO          | null                                           |
| public       | notifications               | nivel                      | text                     | YES         | 'medio'::text                                  |
| public       | padroes_campos              | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | padroes_campos              | tipo_campo                 | character varying        | NO          | null                                           |
| public       | padroes_campos              | valor                      | text                     | NO          | null                                           |
| public       | padroes_campos              | frequencia                 | integer                  | NO          | 1                                              |
| public       | padroes_campos              | regex_pattern              | text                     | YES         | null                                           |
| public       | padroes_campos              | criado_em                  | timestamp with time zone | NO          | null                                           |
| public       | padroes_campos              | ultima_atualizacao         | timestamp with time zone | NO          | null                                           |
| public       | planilha_processos          | id                         | integer                  | NO          | nextval('planilha_processos_id_seq'::regclass) |
| public       | planilha_processos          | tipo_processo_id           | integer                  | NO          | null                                           |
| public       | planilha_processos          | status_id                  | integer                  | NO          | null                                           |
| public       | planilha_processos          | plataforma                 | character varying        | YES         | null                                           |
| public       | planilha_processos          | data_reabertura            | date                     | YES         | null                                           |
| public       | plataformas                 | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | plataformas                 | nome                       | character varying        | NO          | null                                           |
| public       | plataformas                 | url                        | character varying        | NO          | null                                           |
| public       | plataformas                 | created_at                 | timestamp with time zone | YES         | CURRENT_TIMESTAMP                              |
| public       | plataformas                 | updated_at                 | timestamp with time zone | YES         | CURRENT_TIMESTAMP                              |
| public       | plataformas                 | responsavel_id             | uuid                     | YES         | null                                           |
| public       | plataformas                 | detalhes                   | text                     | YES         | null                                           |
| public       | plataformas                 | data_cadastro              | timestamp with time zone | YES         | now()                                          |
| public       | plataformas                 | ultima_atualizacao         | timestamp with time zone | YES         | now()                                          |
| public       | plataformas                 | data_validade              | date                     | YES         | null                                           |
| public       | plataformas                 | observacoes                | text                     | YES         | null                                           |
| public       | processo_distancias         | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | processo_distancias         | processo_id                | uuid                     | YES         | null                                           |
| public       | processo_distancias         | distancia_km               | numeric                  | YES         | null                                           |
| public       | processo_distancias         | ponto_referencia_cidade    | character varying        | YES         | null                                           |
| public       | processo_distancias         | ponto_referencia_uf        | character varying        | YES         | null                                           |
| public       | processo_distancias         | cidade_destino             | character varying        | YES         | null                                           |
| public       | processo_distancias         | uf_destino                 | character varying        | YES         | null                                           |
| public       | processo_distancias         | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | processo_distancias         | texto_completo             | text                     | YES         | null                                           |
| public       | processo_distancias         | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | processo_sistemas           | processo_id                | uuid                     | NO          | null                                           |
| public       | processo_sistemas           | sistema_id                 | uuid                     | NO          | null                                           |
| public       | processo_sistemas_servicos  | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | processo_sistemas_servicos  | processo_id                | uuid                     | NO          | null                                           |
| public       | processo_sistemas_servicos  | sistema_id                 | uuid                     | NO          | null                                           |
| public       | processo_sistemas_servicos  | servico                    | character varying        | NO          | null                                           |
| public       | processo_sistemas_servicos  | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | processo_sistemas_servicos  | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | processos                   | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | processos                   | numero_processo            | text                     | NO          | null                                           |
| public       | processos                   | ano                        | integer                  | NO          | null                                           |
| public       | processos                   | orgao                      | text                     | NO          | null                                           |
| public       | processos                   | modalidade                 | text                     | NO          | null                                           |
| public       | processos                   | tipo_pregao                | text                     | YES         | null                                           |
| public       | processos                   | site_pregao                | text                     | YES         | null                                           |
| public       | processos                   | objeto_completo            | text                     | YES         | null                                           |
| public       | processos                   | objeto_resumido            | text                     | NO          | null                                           |
| public       | processos                   | responsavel                | uuid                     | YES         | null                                           |
| public       | processos                   | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | processos                   | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | processos                   | status                     | text                     | YES         | null                                           |
| public       | processos                   | hora_pregao                | time without time zone   | YES         | null                                           |
| public       | processos                   | data_pregao                | date                     | YES         | null                                           |
| public       | processos                   | estado                     | character varying        | YES         | null                                           |
| public       | processos                   | campo_adicional1           | character varying        | YES         | null                                           |
| public       | processos                   | campo_adicional2           | character varying        | YES         | null                                           |
| public       | processos                   | representante              | uuid                     | YES         | null                                           |
| public       | processos                   | representante_id           | uuid                     | YES         | null                                           |
| public       | processos                   | responsavel_id             | uuid                     | YES         | null                                           |
| public       | processos                   | empresa_id                 | uuid                     | YES         | null                                           |
| public       | processos                   | codigo_analise             | character varying        | YES         | null                                           |
| public       | processos                   | impugnacoes                | text                     | YES         | null                                           |
| public       | processos                   | sistemas_ativos            | ARRAY                    | YES         | null                                           |
| public       | processos                   | distancia_km               | numeric                  | YES         | null                                           |
| public       | processos                   | ponto_referencia_cidade    | character varying        | YES         | null                                           |
| public       | processos                   | ponto_referencia_uf        | character                | YES         | null                                           |
| public       | processos                   | publicacao_original        | text                     | YES         | null                                           |
| public       | processos                   | valor_estimado             | numeric                  | YES         | null                                           |
| public       | processos                   | updated_by                 | uuid                     | YES         | null                                           |
| public       | processos                   | codigo_gpi                 | text                     | YES         | null                                           |
| public       | processos                   | prazo_analise              | date                     | YES         | null                                           |
| public       | processos                   | numero_contrato            | text                     | YES         | null                                           |
| public       | processos                   | sistemas_implantados       | jsonb                    | YES         | null                                           |
| public       | processos                   | empresa_vencedora          | text                     | YES         | null                                           |
| public       | processos                   | sistemas_implantacao       | jsonb                    | YES         | null                                           |
| public       | processos                   | sistemas_listados          | text                     | YES         | null                                           |
| public       | processos                   | impugnacao_data_limite     | date                     | YES         | null                                           |
| public       | processos                   | impugnacao_itens           | text                     | YES         | null                                           |
| public       | processos                   | impugnacao_forma_envio     | text                     | YES         | null                                           |
| public       | processos                   | impugnacao_status          | text                     | YES         | 'nao_iniciado'::text                           |
| public       | processos_empresa_vencedora | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | processos_empresa_vencedora | processo_id                | uuid                     | YES         | null                                           |
| public       | processos_empresa_vencedora | empresa_id                 | uuid                     | YES         | null                                           |
| public       | processos_empresa_vencedora | numero_contrato            | character varying        | YES         | null                                           |
| public       | processos_empresa_vencedora | valor_final                | numeric                  | YES         | null                                           |
| public       | processos_empresa_vencedora | data_assinatura            | date                     | YES         | null                                           |
| public       | processos_empresa_vencedora | observacoes                | text                     | YES         | null                                           |
| public       | processos_empresa_vencedora | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | processos_empresa_vencedora | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | processos_particionada      | id                         | uuid                     | NO          | null                                           |
| public       | processos_particionada      | numero_processo            | text                     | YES         | null                                           |
| public       | processos_particionada      | orgao                      | text                     | YES         | null                                           |
| public       | processos_particionada      | data_pregao                | date                     | YES         | null                                           |
| public       | processos_particionada      | hora_pregao                | time without time zone   | YES         | null                                           |
| public       | processos_particionada      | ano                        | integer                  | NO          | null                                           |
| public       | processos_particionada      | objeto_resumido            | text                     | YES         | null                                           |
| public       | processos_particionada      | objeto_completo            | text                     | YES         | null                                           |
| public       | processos_particionada      | estado                     | text                     | YES         | null                                           |
| public       | processos_particionada      | modalidade                 | text                     | YES         | null                                           |
| public       | processos_particionada      | status                     | text                     | YES         | null                                           |
| public       | processos_particionada      | site_pregao                | text                     | YES         | null                                           |
| public       | processos_particionada      | empresa_id                 | uuid                     | YES         | null                                           |
| public       | processos_particionada      | representante_id           | uuid                     | YES         | null                                           |
| public       | processos_particionada      | responsavel_id             | uuid                     | YES         | null                                           |
| public       | processos_particionada      | sistemas_ativos            | jsonb                    | YES         | null                                           |
| public       | processos_particionada      | sistemas_implantacao       | jsonb                    | YES         | null                                           |
| public       | processos_particionada      | codigo_analise             | text                     | YES         | null                                           |
| public       | processos_particionada      | codigo_gpi                 | text                     | YES         | null                                           |
| public       | processos_particionada      | prazo_analise              | date                     | YES         | null                                           |
| public       | processos_particionada      | valor_estimado             | numeric                  | YES         | null                                           |
| public       | processos_particionada      | empresa_vencedora          | uuid                     | YES         | null                                           |
| public       | processos_particionada      | numero_contrato            | text                     | YES         | null                                           |
| public       | processos_particionada      | distancia_km               | numeric                  | YES         | null                                           |
| public       | processos_particionada      | ponto_referencia_cidade    | text                     | YES         | null                                           |
| public       | processos_particionada      | ponto_referencia_uf        | text                     | YES         | null                                           |
| public       | processos_particionada      | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | processos_particionada      | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | processos_particionada      | updated_by                 | uuid                     | YES         | null                                           |
| public       | profiles                    | id                         | uuid                     | NO          | null                                           |
| public       | profiles                    | role                       | text                     | YES         | 'user'::text                                   |
| public       | profiles                    | created_at                 | timestamp with time zone | YES         | timezone('utc'::text, now())                   |
| public       | profiles                    | updated_at                 | timestamp with time zone | YES         | timezone('utc'::text, now())                   |
| public       | profiles                    | email                      | text                     | YES         | null                                           |
| public       | profiles                    | status                     | text                     | YES         | 'ACTIVE'::text                                 |
| public       | profiles                    | nome                       | text                     | YES         | null                                           |
| public       | publicacoes                 | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | publicacoes                 | processo_id                | uuid                     | YES         | null                                           |
| public       | publicacoes                 | tipo                       | text                     | NO          | null                                           |
| public       | publicacoes                 | titulo                     | text                     | YES         | null                                           |
| public       | publicacoes                 | conteudo                   | text                     | NO          | null                                           |
| public       | publicacoes                 | data_publicacao            | date                     | YES         | null                                           |
| public       | publicacoes                 | fonte                      | text                     | YES         | null                                           |
| public       | publicacoes                 | url                        | text                     | YES         | null                                           |
| public       | publicacoes                 | processado                 | boolean                  | YES         | false                                          |
| public       | publicacoes                 | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | publicacoes                 | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | representantes              | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | representantes              | nome                       | character varying        | NO          | null                                           |
| public       | representantes              | documento                  | character varying        | YES         | null                                           |
| public       | representantes              | email                      | character varying        | YES         | null                                           |
| public       | representantes              | telefone                   | character varying        | YES         | null                                           |
| public       | representantes              | created_at                 | timestamp with time zone | YES         | CURRENT_TIMESTAMP                              |
| public       | representantes              | updated_at                 | timestamp with time zone | YES         | CURRENT_TIMESTAMP                              |
| public       | representantes              | status                     | character varying        | YES         | 'ATIVO'::character varying                     |
| public       | responsaveis_processos      | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | responsaveis_processos      | nome                       | character varying        | NO          | null                                           |
| public       | responsaveis_processos      | email                      | character varying        | NO          | null                                           |
| public       | responsaveis_processos      | departamento               | character varying        | YES         | null                                           |
| public       | responsaveis_processos      | status                     | character varying        | NO          | 'ACTIVE'::character varying                    |
| public       | responsaveis_processos      | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | responsaveis_processos      | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | setores                     | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | setores                     | nome                       | character varying        | NO          | null                                           |
| public       | setores                     | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | setores                     | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | sistema_contatos            | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | sistema_contatos            | sistema_id                 | uuid                     | YES         | null                                           |
| public       | sistema_contatos            | nome                       | character varying        | NO          | null                                           |
| public       | sistema_contatos            | telefone                   | character varying        | YES         | null                                           |
| public       | sistema_contatos            | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | sistema_contatos            | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | sistemas                    | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | sistemas                    | setor_id                   | uuid                     | YES         | null                                           |
| public       | sistemas                    | nome                       | character varying        | NO          | null                                           |
| public       | sistemas                    | descricao                  | text                     | YES         | null                                           |
| public       | sistemas                    | url                        | character varying        | YES         | null                                           |
| public       | sistemas                    | status                     | character varying        | YES         | 'ACTIVE'::character varying                    |
| public       | sistemas                    | created_by                 | uuid                     | YES         | null                                           |
| public       | sistemas                    | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | sistemas                    | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | status_processo             | id                         | integer                  | NO          | nextval('status_processo_id_seq'::regclass)    |
| public       | status_processo             | codigo                     | character varying        | NO          | null                                           |
| public       | status_processo             | descricao                  | character varying        | NO          | null                                           |
| public       | status_processo             | exige_data_reabertura      | boolean                  | NO          | false                                          |
| public       | system_backups              | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | system_backups              | filename                   | text                     | NO          | null                                           |
| public       | system_backups              | tipo                       | text                     | NO          | null                                           |
| public       | system_backups              | status                     | text                     | NO          | null                                           |
| public       | system_backups              | size                       | bigint                   | YES         | 0                                              |
| public       | system_backups              | storage_path               | text                     | YES         | null                                           |
| public       | system_backups              | error_message              | text                     | YES         | null                                           |
| public       | system_backups              | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | system_config               | key                        | text                     | NO          | null                                           |
| public       | system_config               | value                      | jsonb                    | NO          | null                                           |
| public       | system_config               | updated_at                 | timestamp with time zone | YES         | now()                                          |
| public       | system_events               | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | system_events               | type                       | text                     | NO          | null                                           |
| public       | system_events               | status                     | text                     | NO          | null                                           |
| public       | system_events               | details                    | jsonb                    | YES         | null                                           |
| public       | system_events               | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | system_events               | created_by                 | uuid                     | YES         | null                                           |
| public       | system_logs                 | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | system_logs                 | usuario_id                 | uuid                     | NO          | null                                           |
| public       | system_logs                 | usuario_email              | text                     | NO          | null                                           |
| public       | system_logs                 | tipo                       | text                     | NO          | null                                           |
| public       | system_logs                 | tabela                     | text                     | NO          | null                                           |
| public       | system_logs                 | registro_id                | uuid                     | NO          | null                                           |
| public       | system_logs                 | campo_alterado             | text                     | YES         | null                                           |
| public       | system_logs                 | dados_anteriores           | jsonb                    | YES         | null                                           |
| public       | system_logs                 | dados_novos                | jsonb                    | YES         | null                                           |
| public       | system_logs                 | data_hora                  | timestamp with time zone | NO          | null                                           |
| public       | system_logs                 | ip_address                 | text                     | YES         | null                                           |
| public       | system_logs                 | mensagem                   | text                     | YES         | null                                           |
| public       | system_update_reads         | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | system_update_reads         | user_id                    | uuid                     | YES         | null                                           |
| public       | system_update_reads         | update_id                  | uuid                     | YES         | null                                           |
| public       | system_update_reads         | read_at                    | timestamp with time zone | YES         | now()                                          |
| public       | system_updates              | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | system_updates              | title                      | text                     | NO          | null                                           |
| public       | system_updates              | description                | text                     | NO          | null                                           |
| public       | system_updates              | version                    | text                     | YES         | null                                           |
| public       | system_updates              | release_date               | timestamp with time zone | YES         | now()                                          |
| public       | system_updates              | importance                 | text                     | YES         | 'media'::text                                  |
| public       | system_updates              | created_at                 | timestamp with time zone | YES         | now()                                          |
| public       | system_updates              | created_by                 | uuid                     | YES         | null                                           |
| public       | tipos_processo              | id                         | integer                  | NO          | nextval('tipos_processo_id_seq'::regclass)     |
| public       | tipos_processo              | codigo                     | character varying        | NO          | null                                           |
| public       | tipos_processo              | descricao                  | character varying        | NO          | null                                           |
| public       | tipos_processo              | exige_plataforma           | boolean                  | NO          | true                                           |
| public       | user_info_safe              | id                         | uuid                     | YES         | null                                           |
| public       | user_info_safe              | email                      | character varying        | YES         | null                                           |
| public       | user_read_updates           | id                         | uuid                     | NO          | uuid_generate_v4()                             |
| public       | user_read_updates           | user_id                    | uuid                     | NO          | null                                           |
| public       | user_read_updates           | update_id                  | uuid                     | NO          | null                                           |
| public       | user_read_updates           | read_at                    | timestamp with time zone | NO          | now()                                          |
| public       | vw_plataformas_completa     | id                         | uuid                     | YES         | null                                           |
| public       | vw_plataformas_completa     | nome                       | character varying        | YES         | null                                           |
| public       | vw_plataformas_completa     | url                        | character varying        | YES         | null                                           |
| public       | vw_plataformas_completa     | created_at                 | timestamp with time zone | YES         | null                                           |
| public       | vw_plataformas_completa     | updated_at                 | timestamp with time zone | YES         | null                                           |
| public       | vw_plataformas_completa     | responsavel_id             | uuid                     | YES         | null                                           |
| public       | vw_plataformas_completa     | detalhes                   | text                     | YES         | null                                           |
| public       | vw_plataformas_completa     | data_cadastro              | timestamp with time zone | YES         | null                                           |
| public       | vw_plataformas_completa     | ultima_atualizacao         | timestamp with time zone | YES         | null                                           |
| public       | vw_plataformas_completa     | data_validade              | date                     | YES         | null                                           |
| public       | vw_plataformas_completa     | observacoes                | text                     | YES         | null                                           |
| public       | vw_plataformas_completa     | responsavel_email          | character varying        | YES         | null                                           |
| public       | vw_plataformas_completa     | empresas_vinculadas        | ARRAY                    | YES         | null                                           |
| public       | vw_plataformas_completa     | total_empresas_vinculadas  | bigint                   | YES         | null                                           |
| public       | vw_plataformas_completa     | status_validade            | text                     | YES         | null                                           |