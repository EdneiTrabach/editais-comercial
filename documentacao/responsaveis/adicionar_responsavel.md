# Funcionalidade: Adicionar Responsável

## Descrição
Esta funcionalidade permite adicionar novos responsáveis ao sistema. Um modal é exibido com um formulário para preenchimento dos dados do novo responsável.

## Fluxo da Funcionalidade
```mermaid
sequenceDiagram
    actor U as Usuário Admin
    participant V as ResponsaveisAdminView
    participant S as Supabase
    participant DB as Database
    
    U->>V: Clica em "Novo Responsável"
    V-->>U: Exibe modal de adição
    U->>V: Preenche formulário
    U->>V: Submete formulário
    
    V->>V: Valida dados localmente
    
    alt Dados inválidos localmente
        V-->>U: Mostra erro de validação
    else Dados válidos localmente
        V->>S: Verifica se email já existe (responsaveis_processos)
        S->>DB: SELECT id FROM responsaveis_processos WHERE email = ?
        DB-->>S: Resultado da verificação
        S-->>V: Retorna resultado
        
        alt Email já cadastrado como responsável
            V-->>U: Mostra erro "Email já cadastrado como responsável"
        else Email não cadastrado como responsável
            V->>S: Verifica se email já existe (profiles)
            S->>DB: SELECT id FROM profiles WHERE email = ?
            DB-->>S: Resultado da verificação
            S-->>V: Retorna resultado
            
            alt Email já usado por outro usuário
                V-->>U: Mostra erro "Email já em uso por outro usuário"
            else Email disponível
                V->>S: Chama RPC adicionar_responsavel
                S->>DB: Insere novo responsável
                DB-->>S: Confirma inserção
                S-->>V: Retorna sucesso
                V-->>U: Mostra toast "Responsável adicionado com sucesso"
                V->>V: Fecha modal e limpa formulário
                V->>S: loadResponsaveis()
                S->>DB: SELECT * FROM responsaveis_processos
                DB-->>S: Lista atualizada
                S-->>V: Retorna lista atualizada
                V-->>U: Atualiza tabela
            end
        end
    end
```

## Interface de Usuário
O modal de adição contém um formulário com os seguintes campos:
- Nome (obrigatório)
- Email (obrigatório)
- Departamento (opcional)
- Botões de "Cancelar" e "Salvar"

## Validações
O processo de adição realiza as seguintes validações:
1. Validação de campos obrigatórios (nome e email)
2. Verificação se o email já existe na tabela de responsáveis
3. Verificação se o email já existe na tabela de profiles (evita conflitos)

## Dados Inseridos
Os dados são inseridos na tabela `responsaveis_processos` através de uma função RPC:

```javascript
const { error } = await supabase.rpc('adicionar_responsavel', {
  p_nome: newResponsavel.value.nome.trim(),
  p_email: newResponsavel.value.email.trim(),
  p_departamento: newResponsavel.value.departamento.trim() || null
})
```

## Tabela e Colunas
| Tabela | Coluna | Tipo | Descrição |
|--------|--------|------|-----------|
| responsaveis_processos | nome | text | Nome do responsável |
| responsaveis_processos | email | text | Email do responsável (único) |
| responsaveis_processos | departamento | text | Departamento do responsável (opcional) |
| responsaveis_processos | status | text | Status (automático: ACTIVE) |
| responsaveis_processos | created_at | timestamp | Data de criação (automático) |
| responsaveis_processos | updated_at | timestamp | Data de atualização (automático) |

## Função PostgreSQL Utilizada
```sql
CREATE OR REPLACE FUNCTION adicionar_responsavel(p_nome TEXT, p_email TEXT, p_departamento TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO responsaveis_processos (nome, email, departamento, status, created_at, updated_at)
  VALUES (p_nome, p_email, p_departamento, 'ACTIVE', now(), now());
END;
$$;
```

## Tratamento de Erros
- Validação local para campos obrigatórios
- Verificação de duplicidade de email em duas tabelas
- Exibição de mensagens de erro específicas para cada caso
- Feedback visual com toast messages
