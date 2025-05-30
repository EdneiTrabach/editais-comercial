# 7 - Empresas

## Descrição
Tela que permite gerenciar o cadastro de empresas relacionadas aos processos licitatórios, incluindo empresas concorrentes, parceiras e clientes.

## Fluxograma de Gestão de Empresas

```mermaid
flowchart TD
    A[Início] --> B[Usuário acessa tela de empresas]
    B --> C[Carrega lista de empresas]
    C --> D[Exibe tabela com filtros]
    D --> E{Ação do usuário}
    E -->|Adicionar| F[Abre modal de nova empresa]
    F --> G[Preenche dados básicos]
    G --> H[Adiciona contatos]
    H --> I[Categoriza empresa]
    I --> J[Salva informações]
    J --> C
    E -->|Editar| K[Abre modal de edição]
    K --> L[Modifica informações]
    L --> M[Atualiza contatos/categorias]
    M --> N[Salva alterações]
    N --> C
    E -->|Visualizar| O[Exibe detalhes da empresa]
    O --> P[Mostra histórico de relações]
    P --> Q[Lista processos relacionados]
    Q --> D
    E -->|Filtrar| R[Aplica filtros]
    R --> S[Atualiza resultados]
    S --> D
```

## Componentes Principais

1. **Tabela de Empresas**
   - Lista completa das empresas
   - Filtros por categoria/tipo
   - Ordenação por diversos critérios

2. **Formulário de Empresa**
   - Dados cadastrais (nome, CNPJ, etc.)
   - Endereço e contatos
   - Categorização (cliente, concorrente, parceira)

3. **Histórico de Relações**
   - Processos em que a empresa participou
   - Resultados anteriores
   - Comportamento em licitações

4. **Seletor de Empresas Vencedoras**
   - Interface para associar empresas a processos
   - Registro de contratos resultantes

## Implementação

A tela utiliza estilos definidos em `EmpresasView.css` e componentes como `EmpresaVencedoraColuna.vue` para integração com a tabela de processos.

## Casos de Uso

1. **Cadastro de concorrente**
   - Registro de empresas em mesmas licitações
   - Análise de padrões de comportamento

2. **Associação com processos**
   - Definição de empresa vencedora
   - Registro de contratos resultantes

3. **Análise de mercado**
   - Visualização de empresas por região
   - Estatísticas de participação

## Integração com Outras Funcionalidades

- Vinculação com processos licitatórios
- Associação com representantes
- Visualização em análises de mercado

## Recursos Especiais

- Importação de dados da Receita Federal
- Alertas para empresas com restrições legais
- Geolocalização de empresas para análises regionais
