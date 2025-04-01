# Gerenciamento de Usuários

## Visão Geral

O módulo de Gerenciamento de Usuários permite criar, visualizar, editar e desativar contas de usuários no sistema Editais Comerciais, controlar perfis de acesso e gerenciar permissões.

## Fluxo Principal

```mermaid
sequenceDiagram
    participant A as Administrador
    participant S as Sistema
    participant DB as Banco de Dados
    
    A->>S: Acessa Configurações de Usuários
    S->>DB: Busca lista de usuários
    DB->>S: Retorna dados dos usuários
    S->>A: Exibe tabela de usuários
    
    alt Adicionar usuário
        A->>S: Clica em "Adicionar usuário"
        S->>A: Exibe modal de formulário
        A->>S: Preenche dados e confirma
        S->>DB: Insere novo usuário
        S->>A: Exibe confirmação
    else Editar usuário
        A->>S: Edita dados do usuário diretamente na tabela
        S->>DB: Atualiza dados do usuário
    else Alterar status
        A->>S: Clica no botão de status
        S->>DB: Atualiza status do usuário
        S->>A: Reflete alteração visual
    else Excluir usuário
        A->>S: Clica no botão de exclusão
        S->>A: Exibe diálogo de confirmação
        A->>S: Confirma exclusão
        S->>DB: Marca usuário como inativo ou remove
        S->>A: Remove linha da tabela
    end
```

## Interface de Usuário

A interface de gerenciamento de usuários apresenta uma tabela estilo planilha com edição inline e controles para gerenciar os usuários.

```mermaid
graph TD
    A[Tela de Usuários] --> B[Tabela de Usuários]
    A --> C[Botão Adicionar]
    
    B --> D[Coluna Nome]
    B --> E[Coluna Email]
    B --> F[Coluna Função]
    B --> G[Coluna Status]
    B --> H[Coluna Ações]
    
    C --> I[Modal Novo Usuário]
    
    H --> J[Botão Excluir]
    J --> K[Diálogo de Confirmação]
    
    G --> L[Toggle Status]
```

## Estados de Usuário

```mermaid
stateDiagram-v2
    [*] --> Convidado: Criar convite
    Convidado --> Ativo: Aceitar convite
    Convidado --> Expirado: Expirar convite
    Ativo --> Inativo: Desativar
    Inativo --> Ativo: Reativar
    Ativo --> [*]: Excluir
    Inativo --> [*]: Excluir
    Expirado --> [*]: Limpar
```

## Tabela do Banco de Dados

### Tabela: `users`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único do usuário |
| email | TEXT | Email do usuário (login) |
| nome | TEXT | Nome completo do usuário |
| avatar_url | TEXT | URL para avatar/foto do usuário |
| role | TEXT | Função do usuário (admin, gerente, padrao) |
| status | TEXT | Status do usuário (ativo, inativo, convidado) |
| created_at | TIMESTAMP | Data de criação da conta |
| updated_at | TIMESTAMP | Data da última atualização |
| last_login | TIMESTAMP | Data do último login |
| convite_expira | TIMESTAMP | Data de expiração do convite (se aplicável) |
| telefone | TEXT | Telefone de contato |

## Permissões por Perfil

| Ação | Admin | Gerente | Usuário Padrão |
|------|-------|---------|----------------|
| Visualizar usuários | ✓ | ✓ | ✗ |
| Adicionar usuários | ✓ | ✗ | ✗ |
| Editar usuários | ✓ | ✗ | ✗ |
| Desativar usuários | ✓ | ✗ | ✗ |
| Excluir usuários | ✓ | ✗ | ✗ |
| Alterar próprio perfil | ✓ | ✓ | ✓ |

## Integrações

O módulo de gerenciamento de usuários se integra com:

1. **Autenticação Supabase** - Para a criação e gerenciamento de credenciais
2. **Sistema de Notificações** - Para envio de convites e notificações de alteração de status
3. **Log de Atividades** - Para registro de ações realizadas no gerenciamento de usuários
