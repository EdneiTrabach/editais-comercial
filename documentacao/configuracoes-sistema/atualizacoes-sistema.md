# Atualizações do Sistema

## Visão Geral

O módulo de Atualizações do Sistema permite criar, gerenciar e exibir informações sobre novas funcionalidades, correções e melhorias implementadas no sistema Editais Comerciais. Ele garante que todos os usuários sejam notificados sobre mudanças importantes e possam confirmar a leitura dessas atualizações.

## Fluxo de Comunicação

```mermaid
sequenceDiagram
    participant A as Administrador
    participant S as Sistema
    participant DB as Banco de Dados
    participant U as Usuário

    A->>S: Cria nova atualização
    S->>DB: Salva detalhes da atualização
    
    U->>S: Login no sistema
    S->>DB: Verifica atualizações não lidas
    DB->>S: Retorna atualizações pendentes
    
    alt Atualizações pendentes
        S->>U: Exibe modal com atualizações
        U->>S: Lê e confirma cada atualização
        S->>DB: Registra confirmação de leitura
    else Sem atualizações
        S->>U: Continua fluxo normal
    end
```

## Modelo de Dados

```mermaid
erDiagram
    SYSTEM_UPDATES {
        uuid id PK
        string versao
        string titulo
        text descricao
        string importancia
        timestamp data
        uuid criado_por FK
        boolean ativo
        timestamp created_at
    }
    
    UPDATE_READS {
        uuid id PK
        uuid update_id FK
        uuid user_id FK
        timestamp read_at
    }
    
    USERS {
        uuid id PK
        string email
        string nome
        string role
    }
    
    SYSTEM_UPDATES ||--o{ UPDATE_READS : "tem leituras"
    UPDATE_READS }|--|| USERS : "lido por"
    SYSTEM_UPDATES }|--|| USERS : "criado por"
```

## Gerenciamento de Atualizações

### Criar Nova Atualização

```mermaid
sequenceDiagram
    participant A as Administrador
    participant S as Sistema
    participant DB as Banco de Dados
    
    A->>S: Acessa "Atualizações do Sistema"
    S->>A: Exibe lista de atualizações
    A->>S: Clica em "Nova Atualização"
    S->>A: Apresenta formulário
    A->>S: Preenche título, versão, descrição e nível de importância
    A->>S: Salva nova atualização
    S->>DB: Insere registro de atualização
    DB->>S: Confirma inserção
    S->>A: Exibe mensagem de sucesso
    S->>A: Atualiza lista de atualizações
```

### Visualização por Usuários

```mermaid
sequenceDiagram
    participant U as Usuário
    participant S as Sistema
    participant DB as Banco de Dados
    
    U->>S: Faz login no sistema
    S->>DB: Verifica atualizações não lidas
    DB->>S: Retorna lista de atualizações pendentes
    
    alt Existem atualizações não lidas
        S->>U: Exibe modal de atualizações
        
        loop Para cada atualização
            S->>U: Mostra conteúdo da atualização
            U->>S: Navega entre atualizações ou confirma leitura
        end
        
        U->>S: Confirma leitura de todas atualizações
        S->>DB: Registra confirmações de leitura
    end
    
    S->>U: Permite acesso ao sistema
```

## Tabelas do Banco de Dados

### Tabela: `system_updates`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único da atualização |
| versao | TEXT | Número/código da versão |
| titulo | TEXT | Título da atualização |
| descricao | TEXT | Descrição detalhada (suporta formatação) |
| importancia | TEXT | Nível de importância (baixa, média, alta, crítica) |
| data | TIMESTAMP | Data da atualização |
| criado_por | UUID | ID do usuário que criou a atualização |
| ativo | BOOLEAN | Indica se a atualização está ativa |
| created_at | TIMESTAMP | Data de criação do registro |

### Tabela: `update_reads`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único da leitura |
| update_id | UUID | ID da atualização lida |
| user_id | UUID | ID do usuário que leu |
| read_at | TIMESTAMP | Data e hora da leitura |

## Interface de Usuário

### Modal de Atualização para Usuários

O modal de atualização exibido aos usuários inclui:

- Título da atualização
- Versão 
- Data de lançamento
- Descrição formatada com suporte a:
  - Negrito
  - Itálico
  - Links
- Indicador visual do nível de importância
- Botões de navegação entre múltiplas atualizações
- Botão de confirmação de leitura

### Painel de Gerenciamento de Atualizações

A interface de gerenciamento para administradores inclui:

- Lista de todas as atualizações com filtros e busca
- Formulário para criação de novas atualizações com editor de texto rico
- Estatísticas de leitura por atualização
- Opção para desativar/reativar atualizações
- Visualização de quais usuários leram cada atualização

## Níveis de Importância

Os níveis de importância determinam a aparência visual do modal de notificação:

| Nível | Cor | Descrição |
|-------|-----|-----------|
| Baixa | Azul | Pequenas melhorias, não críticas para o uso do sistema |
| Média | Verde | Novas funcionalidades ou melhorias significativas |
| Alta | Amarelo | Mudanças importantes no fluxo de trabalho ou interface |
| Crítica | Vermelho | Correções de segurança ou alterações fundamentais |

## Formatação de Descrição

A descrição das atualizações suporta formatação básica usando Markdown:

- `**texto**` para negrito
- `*texto*` para itálico
- `[texto](url)` para links

## Relatórios e Estatísticas

O sistema mantém estatísticas sobre:

- Percentual de usuários que leram cada atualização
- Tempo médio entre publicação e leitura
- Usuários que ainda não leram atualizações importantes
