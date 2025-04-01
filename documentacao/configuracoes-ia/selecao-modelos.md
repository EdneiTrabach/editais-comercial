# Seleção de Modelos de IA

## Descrição

Este módulo permite configurar qual provedor e modelo de IA será utilizado pelo sistema para processamento de texto e análise de documentos. O sistema suporta múltiplos provedores, cada um com suas características e capacidades específicas.

## Fluxo de Seleção de Modelo

```plantuml
@startuml
start
:Acesso à tela de Configurações de IA;
:Visualização de modelos disponíveis;
if (IA avançada ativada?) then (sim)
  :Exibir seletor de modelo;
  :Selecionar provedor (OpenAI, Claude, Mistral, etc.);
  :Configurar parâmetros específicos do provedor;
  if (Configurar chaves de API?) then (sim)
    :Informar chaves de API e tokens de acesso;
  else (não)
  endif
  :Salvar configurações;
else (não)
  :Exibir opção para ativar IA avançada;
endif
:Verificar conexão com o provedor selecionado;
if (Conexão bem-sucedida?) then (sim)
  :Exibir confirmação de sucesso;
else (não)
  :Exibir mensagem de erro;
  :Sugerir verificação das credenciais;
endif
stop
@enduml
```

## Modelos Suportados

```plantuml
@startuml
skinparam packageStyle rectangle
skinparam monochrome true

package "Provedores de IA" {
  [OpenAI] as OPENAI
  [Claude] as CLAUDE
  [Mistral] as MISTRAL
  [Gemini] as GEMINI
  [DeepSeek] as DEEPSEEK
  [Copilot] as COPILOT
  [Together.ai] as TOGETHER
  [Local (Ollama)] as LOCAL
}

cloud "API Externa" {
  [API Processamento] as API
}

node "Sistema Local" {
  [Modelo Embedido] as LOCAL_MODEL
}

OPENAI --> API : GPT-4/GPT-3.5
CLAUDE --> API : Claude 3 (Opus/Sonnet/Haiku)
MISTRAL --> API : Mistral Large/Medium/Small
GEMINI --> API : Gemini 1.5 Pro/Flash
DEEPSEEK --> API : DeepSeek/DeepSeek Coder
COPILOT --> API : Microsoft Copilot API
TOGETHER --> API : Together.ai models
LOCAL --> LOCAL_MODEL : Ollama localhost
@enduml
```

## Interface de Configuração

A interface de configuração permite:

- Ativar/desativar o uso de IA avançada
- Selecionar o provedor de serviços de IA
- Configurar chaves de API e tokens de acesso
- Definir parâmetros específicos de cada modelo

## Tabelas e Campos do Banco de Dados

### Tabela: `configuracoes`

| Coluna | Tipo | Descrição | Exemplo |
|--------|------|-----------|---------|
| chave | TEXT | Identificador da configuração | 'modelo_ia' |
| valor | TEXT | Valor configurado | 'openai' |
| descricao | TEXT | Descrição da configuração | 'Provedor de IA utilizado' |
| created_at | TIMESTAMP | Data de criação | 2023-01-01 12:00:00 |
| updated_at | TIMESTAMP | Data da última atualização | 2023-01-01 12:00:00 |
| updated_by | UUID | ID do usuário que atualizou | uuid |

### Configurações armazenadas

| Chave | Descrição | Valores Possíveis |
|-------|-----------|-------------------|
| modelo_ia | Provedor de IA selecionado | 'openai', 'claude', 'mistral', 'gemini', 'deepseek', 'copilot', 'local' |
| ia_avancada_ativa | Status de ativação da IA avançada | 'true', 'false' |
| openai_api_key | Chave de API para OpenAI | string (valor encriptado) |
| claude_api_key | Chave de API para Claude | string (valor encriptado) |
| mistral_api_key | Chave de API para Mistral | string (valor encriptado) |
| gemini_api_key | Chave de API para Google Gemini | string (valor encriptado) |
| deepseek_api_key | Chave de API para DeepSeek | string (valor encriptado) |
| openai_modelo | Modelo específico da OpenAI | 'gpt-4', 'gpt-3.5-turbo' |
| claude_modelo | Modelo específico do Claude | 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku' |
| mistral_modelo | Modelo específico do Mistral | 'mistral-large', 'mistral-medium', 'mistral-small' |
| gemini_modelo | Modelo específico do Gemini | 'gemini-1.5-pro', 'gemini-1.5-flash' |
| deepseek_modelo | Modelo específico do DeepSeek | 'deepseek', 'deepseek-coder' |
| local_modelo | Modelo local do Ollama | 'llama3', 'mistral', 'phi' |
