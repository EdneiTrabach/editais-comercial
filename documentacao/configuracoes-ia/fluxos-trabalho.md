# Fluxos de Trabalho - Configurações de IA

Este documento descreve os principais fluxos de trabalho relacionados às configurações de IA no sistema, incluindo configuração inicial, manutenção e monitoramento.

## Fluxo de Configuração Inicial

```plantuml
@startuml
skinparam monochrome true

title Configuração Inicial do Modelo de IA

actor Administrador as Admin
participant "Tela de Configurações" as Config
participant "Serviço de IA" as IAService
participant "Banco de Dados" as DB

Admin -> Config: Acessa módulo de Configurações
Config -> DB: Carrega configurações existentes
DB --> Config: Retorna configurações padrão

Admin -> Config: Ativa modelo avançado de IA
Admin -> Config: Seleciona provedor (ex: OpenAI)
Admin -> Config: Insere chave de API
Admin -> Config: Configura parâmetros básicos

Config -> IAService: Solicita teste de conexão
IAService -> IAService: Envia requisição de teste
IAService --> Config: Retorna resultado do teste

alt Teste bem-sucedido
    Config -> Admin: Exibe confirmação de sucesso
    Config -> DB: Salva configurações
    DB --> Config: Confirmação de salvamento
else Teste falhou
    Config -> Admin: Exibe erro de conectividade
    Config -> Admin: Sugere verificar chave API/parâmetros
end

Admin -> Config: Configura padrões de extração
Config -> DB: Salva padrões
DB --> Config: Confirmação de salvamento

Admin -> Config: Testa extração com documento de exemplo
Config -> IAService: Solicita análise de documento
IAService --> Config: Retorna resultado da análise
Config -> Admin: Exibe resultados e métricas iniciais

@enduml
```

## Fluxo de Ajuste de Parâmetros

```plantuml
@startuml
skinparam monochrome true

title Ajuste de Parâmetros de IA

actor Administrador as Admin
participant "Tela de Parâmetros" as Params
participant "Serviço de IA" as IAService
participant "Banco de Dados" as DB

Admin -> Params: Acessa configurações avançadas
Params -> DB: Carrega parâmetros atuais
DB --> Params: Retorna parâmetros

Admin -> Params: Modifica temperatura (0.7 para 0.5)
Admin -> Params: Ajusta tokens máximos
Admin -> Params: Altera prompt do sistema

Params -> Admin: Sugere testar antes de salvar

Admin -> Params: Solicita teste com texto de amostra
Params -> IAService: Envia requisição com novos parâmetros
IAService --> Params: Retorna resultados do teste

Admin -> Params: Avalia qualidade da resposta

alt Resultado satisfatório
    Admin -> Params: Confirma salvamento
    Params -> DB: Atualiza parâmetros no banco de dados
    DB --> Params: Confirma atualização
    Params -> Admin: Exibe mensagem de sucesso
else Resultado insatisfatório
    Admin -> Params: Realiza novos ajustes
    note right: Ciclo de iteração até obter\nqualidade desejada
end

@enduml
```

## Fluxo de Gerenciamento de Padrões de Campo

```plantuml
@startuml
skinparam monochrome true

title Gerenciamento de Padrões de Campo

actor "Administrador" as Admin
participant "Interface de Padrões" as UI
participant "Validador RegEx" as Validator
participant "Banco de Dados" as DB
participant "Motor de Extração" as Engine

Admin -> UI: Acessa seção de padrões
UI -> DB: Solicita padrões existentes
DB --> UI: Retorna lista de padrões
UI -> Admin: Exibe padrões organizados por tipo

alt Adicionar novo padrão
    Admin -> UI: Seleciona "Adicionar Novo Padrão"
    UI -> Admin: Exibe formulário de criação
    Admin -> UI: Insere nome do campo (ex: "CNPJ Alternativo")
    Admin -> UI: Define expressão regular
    Admin -> UI: Fornece exemplo e descrição
    
    Admin -> UI: Solicita validação
    UI -> Validator: Testa RegEx com exemplo
    
    alt Validação bem-sucedida
        Validator --> UI: Confirmação de padrão válido
        UI -> Admin: Exibe confirmação
        Admin -> UI: Confirma criação
        UI -> DB: Insere novo padrão
        DB --> UI: Confirma inserção
    else Validação falhou
        Validator --> UI: Retorna erro de validação
        UI -> Admin: Exibe problema encontrado
        Admin -> UI: Corrige expressão regular
        note right: Iteração até padrão válido
    end
    
else Editar padrão existente
    Admin -> UI: Seleciona padrão para editar
    UI -> Admin: Exibe formulário de edição
    Admin -> UI: Modifica expressão regular
    
    Admin -> UI: Solicita validação
    UI -> Validator: Testa RegEx com exemplo
    
    alt Validação bem-sucedida
        Validator --> UI: Confirmação de padrão válido
        Admin -> UI: Salva alterações
        UI -> DB: Atualiza padrão
        DB --> UI: Confirma atualização
    else Validação falhou
        Validator --> UI: Retorna erro
        UI -> Admin: Exibe problema encontrado
    end

else Excluir padrão
    Admin -> UI: Seleciona padrão para remover
    UI -> Admin: Solicita confirmação
    
    alt Confirmação positiva
        Admin -> UI: Confirma exclusão
        UI -> DB: Remove padrão
        DB --> UI: Confirma remoção
    else Cancelamento
        Admin -> UI: Cancela operação
    end
end

Admin -> UI: Solicita teste do conjunto de padrões
UI -> Engine: Envia documento de teste com todos os padrões
Engine --> UI: Retorna resultados da extração
UI -> Admin: Exibe resultados com destaques nas correspondências

@enduml
```

## Fluxo de Monitoramento e Análise de Desempenho

```plantuml
@startuml
skinparam monochrome true

title Monitoramento de Desempenho da IA

actor "Administrador" as Admin
participant "Dashboard de IA" as Dashboard
participant "Serviço de Estatísticas" as Stats
database "Banco de Dados" as DB

Admin -> Dashboard: Acessa Dashboard de IA
Dashboard -> Stats: Solicita métricas de desempenho
Stats -> DB: Consulta tabela ia_feedback
Stats -> DB: Consulta tabela analises_ia
DB --> Stats: Retorna dados de feedback
DB --> Stats: Retorna dados de análise

Stats -> Stats: Calcula taxa de acerto global
Stats -> Stats: Calcula taxa de acerto por campo
Stats -> Stats: Analisa tempo médio de resposta
Stats -> Stats: Calcula custo médio por análise
Stats -> Stats: Identifica campos com maior taxa de erro

Stats --> Dashboard: Retorna métricas processadas
Dashboard -> Admin: Exibe dashboard com gráficos e tabelas

Admin -> Dashboard: Filtra por período (último mês)
Dashboard -> Stats: Solicita dados do período específico
Stats -> DB: Consulta dados do período
DB --> Stats: Retorna dados filtrados
Stats --> Dashboard: Retorna métricas do período
Dashboard -> Admin: Atualiza visualização com dados filtrados

Admin -> Dashboard: Identifica campo problemático (Objeto da Licitação)
Admin -> Dashboard: Exporta relatório de desempenho
Dashboard -> Admin: Fornece arquivo de relatório

note right of Admin: Toma decisão de ajustar\nparâmetros ou padrões\nbaseado nos dados

@enduml
```

## Fluxo de Integração de Feedback

```plantuml
@startuml
skinparam monochrome true

title Integração de Feedback de Usuários

actor "Usuário" as User
actor "Administrador" as Admin
participant "Interface de Processo" as UI
participant "Serviço de Feedback" as FB
participant "Banco de Dados" as DB
participant "Sistema de IA" as IA

User -> UI: Visualiza dados extraídos pela IA
User -> UI: Identifica valor incorreto
User -> UI: Edita valor para corrigir
UI -> FB: Registra correção como feedback

FB -> DB: Armazena feedback (valor original e corrigido)
FB -> UI: Confirma registro de feedback
UI -> User: Exibe notificação de feedback registrado

note right: Fluxo de Análise e Melhoria

Admin -> FB: Solicita relatório de feedback
FB -> DB: Consulta dados de feedback recentes
DB --> FB: Retorna dados de feedback
FB --> Admin: Apresenta relatório de feedback

Admin -> IA: Ajusta parâmetros com base no feedback
Admin -> IA: Melhora prompts do sistema

IA -> IA: Incorpora ajustes de feedback
note right: Sistema melhora\niterativamente com\nbase no feedback

@enduml
```

## Ciclo de Vida das Configurações de IA

```plantuml
@startuml
skinparam monochrome true

state "Configuração Inicial" as Init
state "Operação Normal" as Normal
state "Análise de Desempenho" as Analysis
state "Ajuste de Parâmetros" as Tuning
state "Teste de Validação" as Testing
state "Melhoria Contínua" as Improvement

[*] --> Init
Init --> Normal : Configuração\nconcluída

Normal --> Analysis : Período de\nrevisão
Analysis --> Normal : Desempenho\naceitável
Analysis --> Tuning : Desempenho\nabaixo do esperado

Tuning --> Testing : Parâmetros\najustados
Testing --> Normal : Teste\nbem-sucedido
Testing --> Tuning : Teste\nfalhou

Normal --> Improvement : Feedback\ncontínuo
Improvement --> Normal : Melhorias\nimplementadas

@enduml
```

## Check-list de Configuração de IA

1. **Configuração Inicial**
   - [ ] Ativar modelo avançado de IA
   - [ ] Selecionar provedor de IA adequado
   - [ ] Configurar chave API
   - [ ] Definir parâmetros básicos
   - [ ] Realizar teste de conectividade

2. **Configuração de Padrões**
   - [ ] Definir padrões para campos críticos
   - [ ] Validar expressões regulares
   - [ ] Testar extração com documentos reais
   - [ ] Ajustar prioridades de padrões

3. **Configuração de Parâmetros Avançados**
   - [ ] Ajustar temperatura conforme necessidade
   - [ ] Definir limites de tokens
   - [ ] Configurar prompts do sistema
   - [ ] Testar diferentes configurações

4. **Monitoramento**
   - [ ] Configurar alertas para falhas
   - [ ] Definir métricas de acompanhamento
   - [ ] Estabelecer período de revisão regular
   - [ ] Configurar coleta de feedback
