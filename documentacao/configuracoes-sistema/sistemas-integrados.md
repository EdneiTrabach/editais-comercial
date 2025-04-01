# Sistemas Integrados

## Visão Geral

O módulo de Sistemas Integrados permite gerenciar os sistemas que a empresa comercializa e que podem ser oferecidos nos processos licitatórios. Esta configuração é essencial para o módulo de Processos, onde os sistemas são associados às oportunidades de licitação.

## Fluxo de Gestão de Sistemas

```mermaid
flowchart TB
    A[Acesso à Configuração de Sistemas] --> B[Listagem de Sistemas]
    B --> C{Ação}
    
    C -->|Adicionar| D[Novo Sistema]
    C -->|Editar| E[Editar Sistema]
    C -->|Visualizar| F[Detalhes do Sistema]
    C -->|Desativar/Ativar| G[Alterar Status]
    
    D --> H[Preencher Dados]
    E --> H
    
    H --> I[Associar ao Setor]
    H --> J[Adicionar Contatos]
    
    I --> K[Salvar]
    J --> K
    
    K --> B
    G --> B
```

## Modelo de Dados

```mermaid
erDiagram
    SISTEMAS {
        uuid id PK
        string nome
        string descricao
        string url
        boolean status
        uuid setor_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    SETORES {
        uuid id PK
        string nome
        timestamp created_at
    }
    
    SISTEMA_CONTATOS {
        uuid id PK
        uuid sistema_id FK
        string nome
        string telefone
        timestamp created_at
    }
    
    SISTEMAS ||--o{ SISTEMA_CONTATOS : "possui"
    SISTEMAS }|--|| SETORES : "pertence"
```

## Fluxo de Trabalho

### Adicionar Novo Sistema

```mermaid
sequenceDiagram
    participant U as Usuário
    participant S as Sistema
    participant DB as Banco de Dados
    
    U->>S: Acessa "Sistemas"
    S->>U: Exibe lista de sistemas
    U->>S: Clica em "Adicionar Sistema"
    S->>U: Abre modal com formulário
    U->>S: Preenche nome, descrição, URL e escolhe setor
    U->>S: Adiciona contatos (opcional)
    U->>S: Clica em "Salvar"
    S->>DB: Insere dados do sistema
    S->>DB: Insere contatos associados
    DB->>S: Confirma inserção
    S->>U: Exibe mensagem de sucesso
    S->>U: Atualiza lista de sistemas
```

### Editar Sistema Existente

```mermaid
sequenceDiagram
    participant U as Usuário
    participant S as Sistema
    participant DB as Banco de Dados
    
    U->>S: Acessa "Sistemas"
    S->>U: Exibe lista de sistemas
    U->>S: Seleciona sistema para editar
    S->>DB: Busca detalhes do sistema
    DB->>S: Retorna dados e contatos
    S->>U: Exibe formulário preenchido
    U->>S: Modifica dados necessários
    U->>S: Adiciona/remove contatos
    U->>S: Clica em "Atualizar"
    S->>DB: Atualiza dados do sistema
    S->>DB: Atualiza contatos associados
    DB->>S: Confirma atualização
    S->>U: Exibe mensagem de sucesso
    S->>U: Atualiza lista de sistemas
```

## Tabelas do Banco de Dados

### Tabela: `sistemas`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único do sistema |
| nome | TEXT | Nome do sistema |
| descricao | TEXT | Descrição do sistema |
| url | TEXT | URL da página/documentação do sistema |
| status | BOOLEAN | Status do sistema (ativo/inativo) |
| setor_id | UUID | ID do setor ao qual o sistema pertence |
| created_at | TIMESTAMP | Data de criação do registro |
| updated_at | TIMESTAMP | Data da última atualização |

### Tabela: `setores`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único do setor |
| nome | TEXT | Nome do setor |
| created_at | TIMESTAMP | Data de criação do registro |

### Tabela: `sistema_contatos`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único do contato |
| sistema_id | UUID | ID do sistema ao qual o contato está associado |
| nome | TEXT | Nome do contato |
| telefone | TEXT | Telefone do contato |
| created_at | TIMESTAMP | Data de criação do registro |

## Interface de Usuário

O gerenciamento de sistemas possui duas visualizações principais:

1. **Lista de Sistemas**: Exibe todos os sistemas cadastrados com opções de filtro, busca e ações rápidas.
2. **Formulário de Sistema**: Para adição e edição de sistemas, incluindo gerenciamento de contatos.

### Lista de Sistemas

A lista apresenta os sistemas em formato de tabela ou cards, exibindo:
- Nome do sistema
- Setor
- Status (ativo/inativo)
- Número de contatos associados
- Ações disponíveis

### Formulário de Sistema

O formulário de adição/edição contém:
- Campos básicos (nome, descrição, URL)
- Seletor de setor
- Gerenciador de contatos (adição/remoção dinâmica)
- Opções para salvar ou cancelar

## Integrações com Outros Módulos

O módulo de Sistemas Integrados se relaciona com:

1. **Processos Licitatórios**: Os sistemas são associados a processos para identificar quais produtos estão sendo ofertados
2. **Implementações**: Registro de implantações realizadas após a vitória em licitações
3. **Relatórios**: Dados para análises estatísticas sobre quais sistemas são mais comercializados
