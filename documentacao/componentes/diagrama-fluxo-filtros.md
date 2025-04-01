# Diagrama de Fluxo - Componente de Filtro Avançado

Este documento ilustra o fluxo de dados e estados do componente de filtro avançado, bem como sua interação com outros componentes do sistema.

## Fluxo de Interação do Usuário

```mermaid
sequenceDiagram
    actor User as Usuário
    participant FC as Componente de Filtro
    participant Parent as Componente Pai
    participant API as API Backend
    
    User->>FC: Clica em "Filtro Avançado"
    FC->>FC: Exibe painel de filtros
    
    alt Seleção de Filtro
        User->>FC: Seleciona filtros
        FC->>FC: Atualiza estado interno
        FC->>Parent: Emite "update-filters"
    end
    
    alt Aplicação de Filtro
        User->>FC: Clica em "Aplicar Filtros"
        FC->>Parent: Emite "apply-filters" com filtros
        Parent->>API: Solicita dados filtrados
        API->>Parent: Retorna dados filtrados
        Parent->>User: Exibe resultados filtrados
    end
    
    alt Limpar Filtros
        User->>FC: Clica em "Limpar Filtros"
        FC->>FC: Limpa todos os filtros
        FC->>Parent: Emite "clear-filters"
        Parent->>API: Solicita dados sem filtros
        API->>Parent: Retorna todos os dados
        Parent->>User: Exibe todos os resultados
    end
    
    alt Fechar Filtro
        User->>FC: Clica em "Fechar"
        FC->>Parent: Emite "close"
        Parent->>FC: Esconde componente de filtro
    end
```

## Estado dos Filtros e Processamento

```mermaid
stateDiagram-v2
    [*] --> Inicial: Componente montado
    
    Inicial --> FiltrosAtivos: Usuário seleciona filtros
    FiltrosAtivos --> FiltrosAplicados: Usuário clica "Aplicar"
    FiltrosAtivos --> Inicial: Usuário clica "Limpar"
    
    FiltrosAplicados --> Processando: Inicia requisição de dados
    Processando --> ResultadosFiltrados: Dados recebidos
    Processando --> ErroFiltragem: Erro na requisição
    
    ResultadosFiltrados --> FiltrosAplicados: Usuário modifica filtros
    ResultadosFiltrados --> Inicial: Usuário limpa filtros
    
    ErroFiltragem --> FiltrosAplicados: Tentar novamente
    
    state FiltrosAtivos {
        [*] --> AtualizandoUI
        AtualizandoUI --> EmitindoAtualizacao
        EmitindoAtualizacao --> [*]
    }
    
    state Processando {
        [*] --> RequisicaoAPI
        RequisicaoAPI --> ProcessandoResposta
        ProcessandoResposta --> [*]
    }
```

## Arquitetura de Componentes

```mermaid
flowchart TB
    subgraph "Aplicação"
        App[App.vue]
        Router[Vue Router]
        Store[Estado Global]
    end
    
    subgraph "Views"
        PV[ProcessosView]
        AV[AnalisesView]
        DV[DashboardView]
    end
    
    subgraph "Componentes de Filtro"
        direction LR
        AFC[AdvancedFilterComponent]
        FS[FiltroSimples]
    end
    
    subgraph "Composables"
        UF[useFormatters]
        UFil[useFiltros]
        UA[useAnalises]
    end
    
    App --> Router
    Router --> PV
    Router --> AV
    Router --> DV
    
    PV --> AFC
    AV --> AFC
    PV --> FS
    
    AFC --> UFil
    AFC --> UF
    FS --> UFil
    
    PV --> UFil
    AV --> UA
    UA --> UFil
    
    Store <--> UFil
```

## Ciclo de Vida do Componente

```mermaid
flowchart TB
    Start([Início]) --> Setup[Setup do componente]
    Setup --> InitProps[Inicialização das props]
    InitProps --> WatchProps[Configuração de watchers]
    WatchProps --> MountUi[Montagem da UI]
    
    MountUi --> WaitInteraction[Aguarda interação]
    
    WaitInteraction --> |Mudança nos filtros| UpdateFilters[Atualizar filtros]
    UpdateFilters --> EmitUpdate[Emitir update-filters]
    EmitUpdate --> WaitInteraction
    
    WaitInteraction --> |Aplicar| ApplyFilters[Aplicar filtros]
    ApplyFilters --> EmitApply[Emitir apply-filters]
    EmitApply --> WaitInteraction
    
    WaitInteraction --> |Limpar| ClearFilters[Limpar filtros]
    ClearFilters --> EmitClear[Emitir clear-filters]
    EmitClear --> WaitInteraction
    
    WaitInteraction --> |Fechar| Close[Fechar componente]
    Close --> EmitClose[Emitir close]
    EmitClose --> End([Fim])
```
