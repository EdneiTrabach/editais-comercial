# Configurações de IA

## Visão Geral

O módulo de Configurações de IA permite gerenciar os parâmetros relacionados à inteligência artificial do sistema, incluindo modelos utilizados, padrões de campo e estatísticas de precisão.

## Componentes Principais

```mermaid
graph TD
    A[Configurações de IA] --> B[Seleção de Modelo]
    A --> C[IA Avançada]
    A --> D[Padrões de Campo]
    A --> E[Estatísticas de Precisão]
    
    B --> B1[OpenAI GPT-4]
    B --> B2[OpenAI GPT-3.5]
    B --> B3[Modelos Personalizados]
    
    C --> C1[Ativação/Desativação]
    C --> C2[Parâmetros de Consulta]
    
    D --> D1[Gerenciar Padrões]
    D --> D2[Adicionar Padrão]
    D --> D3[Remover Padrão]
    
    E --> E1[Visualizar Estatísticas]
    E --> E2[Feedback de Usuários]
    E --> E3[Taxa de Acerto]
```

## Fluxos de Configuração

### Seleção de Modelo de IA

```mermaid
sequenceDiagram
    participant A as Administrador
    participant C as Configurações
    participant DB as Banco de Dados
    
    A->>C: Acessa Configurações de IA
    C->>DB: Busca configurações atuais
    DB->>C: Retorna configurações
    C->>A: Exibe interface de configurações
    
    A->>C: Seleciona modelo de IA
    A->>C: Toggle IA avançada (ligada/desligada)
    A->>C: Salva configurações
    C->>DB: Atualiza configurações
    C->>A: Exibe mensagem de confirmação
```

### Gerenciamento de Padrões de Campo

```mermaid
sequenceDiagram
    participant A as Administrador
    participant C as Configurações
    participant DB as Banco de Dados
    
    A->>C: Acessa seção de Padrões de Campo
    C->>DB: Busca padrões existentes
    DB->>C: Retorna lista de padrões
    C->>A: Exibe lista de padrões
    
    alt Adicionar Padrão
        A->>C: Clica em "Adicionar Padrão"
        C->>A: Mostra formulário de novo padrão
        A->>C: Preenche campo, regex e exemplo
        A->>C: Salva novo padrão
        C->>DB: Insere novo padrão
        C->>A: Atualiza lista com novo padrão
    else Remover Padrão
        A->>C: Seleciona padrão para remover
        C->>A: Confirma remoção
        A->>C: Confirma
        C->>DB: Remove padrão
        C->>A: Atualiza lista sem o padrão removido
    end
```

### Visualização de Estatísticas de Precisão

```mermaid
flowchart TD
    A[Acesso às Estatísticas] --> B[Carrega Dados]
    B --> C{Dados Disponíveis?}
    
    C -->|Sim| D[Exibe Gráficos de Precisão]
    C -->|Não| E[Exibe Mensagem]
    
    D --> F[Taxa de Acerto por Campo]
    D --> G[Evolução da Precisão]
    D --> H[Feedback dos Usuários]
    
    F --> I[Filtro por Período]
    G --> I
    H --> I
```

## Tabelas do Banco de Dados

### Tabela: `configuracoes`

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| chave | TEXT | Identificador da configuração | 'ia_avancada_ativa' |
| valor | TEXT | Valor da configuração | 'true' ou 'false' |
| descricao | TEXT | Descrição da configuração | 'Ativa/desativa recursos avançados de IA' |
| created_at | TIMESTAMP | Data de criação | 2023-01-01 12:00:00 |
| updated_at | TIMESTAMP | Data da última atualização | 2023-01-01 12:00:00 |
| updated_by | UUID | ID do usuário que atualizou | uuid |

### Tabela: `padroes_campo`

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| id | UUID | Identificador único do padrão | uuid |
| nome_campo | TEXT | Nome do campo associado ao padrão | 'cnpj' |
| regex | TEXT | Expressão regular do padrão | '\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}' |
| descricao | TEXT | Descrição do padrão | 'Formato de CNPJ' |
| exemplo | TEXT | Exemplo de valor que atende ao padrão | '12.345.678/0001-90' |
| ativo | BOOLEAN | Indica se o padrão está ativo | true |
| created_at | TIMESTAMP | Data de criação | 2023-01-01 12:00:00 |
| updated_at | TIMESTAMP | Data da última atualização | 2023-01-01 12:00:00 |

### Tabela: `ia_feedback`

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| id | UUID | Identificador único do feedback | uuid |
| campo | TEXT | Nome do campo avaliado | 'objeto_licitacao' |
| valor_original | TEXT | Valor extraído pela IA | 'Aquisição de software...' |
| valor_corrigido | TEXT | Valor corrigido pelo usuário | 'Aquisição de licenças de software...' |
| correto | BOOLEAN | Se o valor original estava correto | false |
| user_id | UUID | ID do usuário que forneceu feedback | uuid |
| processo_id | UUID | ID do processo relacionado | uuid |
| created_at | TIMESTAMP | Data do feedback | 2023-01-01 12:00:00 |

## Configurações de IA Disponíveis

| Configuração | Chave no Banco | Valores Possíveis | Descrição |
|--------------|----------------|-------------------|-----------|
| IA Avançada | ia_avancada_ativa | 'true', 'false' | Ativa/desativa recursos avançados de IA |
| Modelo de IA | modelo_ia | 'gpt-4', 'gpt-3.5-turbo', 'custom' | Define qual modelo de IA será utilizado |
| Temperatura | temperatura_ia | '0' a '1' (string) | Controla a criatividade das respostas (0 = mais determinístico, 1 = mais criativo) |
| Tokens Máximos | max_tokens | '500' a '4000' (string) | Máximo de tokens por resposta |
| Timeout de Consulta | timeout_consulta | '30' a '120' (string) | Tempo máximo de espera por resposta (segundos) |

## Impacto no Sistema

A configuração da IA afeta diretamente:

1. **Extração de Dados** - Precisão na extração de informações de editais
2. **Sugestões Automáticas** - Qualidade das sugestões apresentadas aos usuários
3. **Análises Preditivas** - Precisão das análises e previsões
4. **Consumo de API** - Custos associados ao uso de modelos diferentes
