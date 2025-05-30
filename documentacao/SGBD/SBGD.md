# Documentação do Banco de Dados

## Visão Geral do Esquema de Banco de Dados

Este documento apresenta um mapeamento das tabelas do banco de dados e suas relações, organizadas por domínios funcionais.

## Índice
1. [Processos e Licitações](#processos-e-licitações)
2. [Empresas e Plataformas](#empresas-e-plataformas)
3. [Sistemas e Setores](#sistemas-e-setores)
4. [Usuários e Perfis](#usuários-e-perfis)
5. [Notificações](#notificações)
6. [Análises e Extrações](#análises-e-extrações)
7. [Sistema e Configuração](#sistema-e-configuração)
8. [Inconsistências Identificadas](#inconsistências-identificadas)
9. [Correções Recomendadas](#correções-recomendadas)

## Processos e Licitações

Este grupo de tabelas gerencia os processos licitatórios e suas informações relacionadas.

```mermaid
erDiagram
    processos {
        uuid id PK
        text numero_processo
        integer ano
        text orgao
        text modalidade
        text objeto_resumido
        uuid responsavel_id FK
        uuid representante_id FK
        uuid empresa_id FK
        text status
        date data_pregao
        text sistemas_ativos
        text codigo_gpi
    }
    
    processos_particionada {
        uuid id PK
        text numero_processo
        integer ano PK
        text orgao
        text objeto_resumido
        uuid responsavel_id FK
        uuid representante_id FK
    }
    
    processo_sistemas {
        uuid processo_id PK,FK
        uuid sistema_id PK,FK
    }
    
    processo_sistemas_servicos {
        uuid id PK
        uuid processo_id FK
        uuid sistema_id FK
        varchar servico
    }
    
    processo_distancias {
        uuid id PK
        uuid processo_id FK
        numeric distancia_km
        varchar cidade_destino
        varchar uf_destino
    }
    
    editais {
        uuid id PK
        text titulo
        text descricao
        numeric valor
        timestamp data_limite
        text status
        uuid responsavel_id FK
    }
    
    publicacoes {
        uuid id PK
        uuid processo_id FK
        text tipo
        text titulo
        text conteudo
        date data_publicacao
        text fonte
        text url
        boolean processado
    }

    processos ||--o{ processo_sistemas : "possui"
    processos ||--o{ processo_sistemas_servicos : "possui"
    processos ||--o{ processo_distancias : "possui"
    processos ||--o{ publicacoes : "possui"
    processo_sistemas }o--|| sistemas : "referencia"
    processo_sistemas_servicos }o--|| sistemas : "referencia"
```

## Empresas e Plataformas

Este grupo gerencia empresas e suas relações com plataformas de licitação.

```mermaid
erDiagram
    empresas {
        uuid id PK
        text nome
        text cnpj
        text razao_social
        text contato
        text email
    }

    plataformas {
        uuid id PK
        varchar nome
        varchar url
        uuid responsavel_id FK
        text detalhes
        date data_validade
    }

    empresa_plataforma {
        uuid id PK
        uuid empresa_id FK
        uuid plataforma_id FK
        timestamp data_cadastro
    }

    empresa_plataforma_dados {
        uuid id PK
        uuid empresa_id FK
        uuid plataforma_id FK
        varchar login
        varchar senha
        date data_validade
        uuid responsavel_id FK
    }

    empresas ||--o{ empresa_plataforma : "vinculada"
    plataformas ||--o{ empresa_plataforma : "utilizada"
    empresas ||--o{ empresa_plataforma_dados : "possui credenciais"
    plataformas ||--o{ empresa_plataforma_dados : "requer credenciais"
```

## Sistemas e Setores

Este grupo gerencia os sistemas oferecidos e seus setores relacionados.

```mermaid
erDiagram
    sistemas {
        uuid id PK
        uuid setor_id FK
        varchar nome
        text descricao
        varchar url
        varchar status
        uuid created_by FK
    }

    sistema_contatos {
        uuid id PK
        uuid sistema_id FK
        varchar nome
        varchar telefone
    }

    setores {
        uuid id PK
        varchar nome
    }

    sistemas }o--|| setores : "pertence"
    sistemas ||--o{ sistema_contatos : "possui"
```

## Usuários e Perfis

Este grupo gerencia perfis de usuários e responsáveis por processos.

```mermaid
erDiagram
    profiles {
        uuid id PK
        text role
        text email
        text status
        text nome
    }

    representantes {
        uuid id PK
        varchar nome
        varchar documento
        varchar email
        varchar telefone
        varchar status
    }

    responsaveis_processos {
        uuid id PK
        varchar nome
        varchar email
        varchar departamento
        varchar status
    }

    profiles ||--o{ notifications : "envia"
    representantes ||--o{ processos : "representa"
    responsaveis_processos ||--o{ processos : "responsável por"
```

## Notificações

Este grupo gerencia o sistema de notificações da aplicação.

```mermaid
erDiagram
    notifications {
        uuid id PK
        uuid processo_id FK
        text title
        text message
        uuid sender_id FK
        boolean resolved
        uuid resolved_by FK
        text tipo
        text nivel
    }

    notification_recipients {
        uuid id PK
        uuid notification_id FK
        uuid user_id FK
        boolean read
        timestamp read_at
    }

    notification_schedules {
        uuid id PK
        uuid processo_id FK
        text status
        text message
        timestamp next_notification
        boolean active
        text tipo
    }

    notifications ||--o{ notification_recipients : "enviada para"
    processos ||--o{ notifications : "gera"
    processos ||--o{ notification_schedules : "possui"
```

## Análises e Extrações

Este grupo gerencia análises de inteligência artificial e extrações de dados.

```mermaid
erDiagram
    analises_ia {
        uuid id PK
        text texto_publicacao
        jsonb dados_extraidos
        varchar modelo
        timestamp timestamp
        boolean validado
        jsonb correcoes
        integer confianca
    }

    analises_ia_feedback {
        uuid id PK
        uuid analise_id FK
        boolean correto
        jsonb correcoes
        timestamp timestamp
        varchar modelo
    }

    feedback_analises {
        uuid id PK
        uuid analise_id FK
        boolean correto
        jsonb correcoes
        uuid usuario_id FK
    }

    analises_itens {
        uuid id PK
        uuid processo_id FK
        uuid sistema_id FK
        integer total_itens
        integer nao_atendidos
        boolean obrigatorio
        boolean eh_anotacao
        text sistema_nome_personalizado
    }

    extractions {
        uuid id PK
        text texto_original
        text tipo
        jsonb dados_extraidos
        timestamp timestamp
    }

    extractions_feedback {
        uuid id PK
        uuid extraction_id FK
        jsonb dados_corrigidos
        timestamp timestamp
        uuid usuario_id FK
    }

    extractions_learning {
        uuid id PK
        text original_text
        jsonb extracted_data
        jsonb corrected_data
        float confidence_score
        boolean is_validated
    }

    padroes_campos {
        uuid id PK
        varchar tipo_campo
        text valor
        integer frequencia
        text regex_pattern
    }

    analises_ia ||--o{ analises_ia_feedback : "recebe feedback"
    analises_ia ||--o{ feedback_analises : "recebe feedback"
    processos ||--o{ analises_itens : "possui itens análise"
    sistemas ||--o{ analises_itens : "referenciado em"
    extractions ||--o{ extractions_feedback : "recebe feedback"
```

## Sistema e Configuração

Este grupo gerencia configurações do sistema e eventos de sistema.

```mermaid
erDiagram
    system_config {
        text key PK
        jsonb value
        timestamp updated_at
    }

    system_backups {
        uuid id PK
        text filename
        text tipo
        text status
        bigint size
        text storage_path
        text error_message
    }

    system_events {
        uuid id PK
        text type
        text status
        jsonb details
        uuid created_by FK
    }

    system_updates {
        uuid id PK
        text title
        text description
        text version
        timestamp release_date
        text importance
        uuid created_by FK
    }

    system_update_reads {
        uuid id PK
        uuid user_id FK
        uuid update_id FK
        timestamp read_at
    }

    configuracoes {
        uuid id PK
        varchar chave
        text valor
        text descricao
        varchar tipo
        timestamp ultima_atualizacao
    }

    system_updates ||--o{ system_update_reads : "lida por"
    profiles ||--o{ system_update_reads : "lê"
```

## Inconsistências Identificadas

1. **Tabelas Redundantes**:
   - `processos` e `processos_particionada` parecem ser redundantes, com a segunda sendo uma versão particionada por ano da primeira
   - `feedback_analises` e `analises_ia_feedback` têm propósitos similares
   - `configuracoes` e `system_config` parecem ter funções sobrepostas

2. **Referências Ausentes**:
   - Várias tabelas referenciam `users.id` mas não há uma tabela `users` definida no esquema
   - A relação entre `profiles` e `users` não está claramente definida 
   - A tabela `system_logs` está sendo referenciada na aplicação mas não existe no banco de dados, causando erros 404

3. **Inconsistências de Nomenclatura**:
   - Algumas tabelas usam prefixo `system_` enquanto outras não seguem este padrão
   - Mistura de português e inglês nos nomes das tabelas e colunas

4. **Possíveis Problemas de Design**:
   - A tabela `processo_sistemas` parece ser apenas uma tabela de junção com duas colunas PK/FK
   - Há objetos de visualização como `vw_plataformas_completa` incluídos na lista de tabelas
   - Ambiguidade na coluna `sistema_id` em consultas envolvendo múltiplas tabelas (processo_sistemas, processo_sistemas_servicos)

5. **Tratamento de Timestamps**:
   - Algumas tabelas têm triggers para atualizar `updated_at` automaticamente, mas não está claro se todas seguem o mesmo padrão
   - Mistura de convenções como `updated_at`, `ultima_atualizacao` e `updated_at`

6. **Campos JSONB**:
   - Várias tabelas usam campos JSONB para armazenar dados estruturados, o que pode dificultar consultas e criar redundância
