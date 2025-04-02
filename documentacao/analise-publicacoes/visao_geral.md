# Visão Geral - Análise de Publicações Contratuais

## Descrição da Funcionalidade

O módulo de "Análise de Publicações Contratuais" permite a extração automática e análise inteligente de dados de publicações oficiais relacionadas a processos licitatórios. O sistema é capaz de analisar o conteúdo textual de publicações para extrair informações como número de processo, órgão, modalidade, objeto, valor estimado, empresas vencedoras e sistemas a serem implantados.

## Acesso

- Disponível para todos os usuários autenticados
- Acessível a partir da tela de detalhes de um processo ou no formulário de criação de processos

## Funcionalidades Principais

1. **Extração de Dados Básicos**: Identificação automática de informações como número do processo, data, órgão e objeto
2. **Detecção de Empresas Vencedoras**: Identificação de empresas mencionadas como vencedoras nas publicações
3. **Identificação de Sistemas**: Reconhecimento de sistemas de software mencionados nas publicações
4. **Análise de Contratos**: Extração de números de contrato e valores contratuais
5. **Cache Inteligente**: Armazenamento em cache para processamentos recorrentes
6. **Múltiplos Modelos de IA**: Utilização de diferentes modelos de IA para aprimorar precisão

## Arquitetura do Módulo

```mermaid
flowchart TB
    U[Usuário] --> |Insere texto| P[PublicacaoImportView]
    P --> |Processa texto| E[usePublicationProcessing]
    E --> |Extração básica| R[Expressões Regulares]
    E --> |Análise avançada| I[useIAAnalyzer]
    I --> |Modelo básico| MB[Extração por padrões]
    I --> |Modelo avançado| MA[useIAAdvanced]
    MA --> |Modelo local| ML[useIALocal]
    MA --> |Modelo API| API[OpenAI API]
    E --> |Armazena resultado| C[Cache]
    E --> |Retorna dados extraídos| P
    P --> |Preenche formulário| U
```

## Modelo de Dados Simplificado

```mermaid
erDiagram
    processos {
        uuid id PK
        text publicacao_original
        text numero
        text ano
        text orgao
        date data_pregao
        time hora_pregao
        text modalidade
        text objeto_resumido
        text objeto_completo
        decimal valor_estimado
        uuid empresa_vencedora FK
        text numero_contrato
    }
    
    analises_ia {
        uuid id PK
        text texto_publicacao
        jsonb dados_extraidos
        text modelo_ia
        timestamp timestamp
        boolean validado
    }
    
    padroes_campos {
        uuid id PK
        text tipo_campo
        text valor
        text regex_pattern
        int frequencia
        timestamp criado_em
    }
    
    empresas {
        uuid id PK
        text nome
        text cnpj
        text razao_social
    }
    
    sistemas {
        uuid id PK
        text nome
        text status
    }
    
    processos ||--o{ analises_ia : "é analisado por"
    processos }|--|| empresas : "tem vencedora"
    processos }o--o{ sistemas : "implementa"
```

## Fluxo de Processamento

```mermaid
sequenceDiagram
    actor Usuario
    participant Form as Formulário
    participant PP as usePublicationProcessing
    participant IA as useIAAnalyzer
    participant DB as Database
    
    Usuario->>Form: Insere texto da publicação
    Form->>PP: Envia texto para processamento
    
    alt Verificar no cache
        PP->>PP: Verifica texto no cache
        PP->>Form: Retorna dados do cache (se existir)
    else Processamento completo
        PP->>PP: Processamento básico (regex)
        PP->>IA: Solicita análise avançada
        
        IA->>DB: Consulta padrões conhecidos
        DB-->>IA: Retorna padrões
        
        IA->>IA: Análise com modelo básico
        
        alt Modelo avançado disponível
            IA->>IA: Análise com modelo avançado
        end
        
        IA-->>PP: Retorna resultados da análise
        PP->>PP: Armazena resultado no cache
        PP-->>Form: Retorna dados extraídos
    end
    
    Form->>Usuario: Apresenta dados para validação
    Usuario->>Form: Valida e confirma dados
    Form->>DB: Salva dados no processo
```

## Tabelas Principais do Banco de Dados

| Tabela | Descrição |
|--------|-----------|
| processos | Armazena as informações de processos licitatórios, incluindo dados extraídos das publicações |
| analises_ia | Registra as análises realizadas pelos modelos de IA para aprendizado futuro |
| padroes_campos | Armazena padrões conhecidos para diferentes campos para melhorar a extração |
| empresas | Cadastro de empresas que podem ser identificadas nas publicações |
| sistemas | Cadastro de sistemas que podem ser mencionados nas publicações |

## Tecnologias Utilizadas

- Expressões regulares para extração básica de dados
- Cache local para melhorar desempenho em textos similares
- Modelos de IA para análise avançada:
  - Modelo básico baseado em regras
  - Modelo local opcional (Ollama)
  - Integração com OpenAI API
- Feedback de usuário para aprendizado contínuo
