# Editais Comercial

Sistema para gerenciamento de processos licitatórios, desenvolvido para auxiliar empresas na identificação, acompanhamento e participação em processos de licitações públicas.

## Tecnologias

- Vue 3
- Vite
- Supabase (Autenticação e Banco de Dados)
- Chart.js (Gráficos e Dashboards)
- XLSX (Processamento de planilhas)

## Módulos do Sistema

### Dashboard
Visão geral dos processos licitatórios, com gráficos e estatísticas.

### Processos
Gerenciamento de processos licitatórios, desde a identificação até a conclusão.

### Configurações do Sistema
Gerenciamento de configurações globais da aplicação.

#### Subcomponentes de Configurações
- **Gerenciamento de Usuários**: Controle de acesso, permissões e perfis.
- **Configurações de IA**: Ajustes de modelos de IA e parâmetros de extração.
- **Sistemas Integrados**: Gerenciamento dos sistemas comercializados pela empresa.
- **Atualizações do Sistema**: Notas de versão e comunicação de melhorias.
- **Parâmetros Gerais**: Configurações visuais, notificações, segurança, etc.

## Instalação

```bash
# Instalar dependências
npm install

# Executar em modo de desenvolvimento
npm run dev

# Compilar para produção
npm run build
```

## Configuração

O sistema utiliza variáveis de ambiente para configuração. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

## Configuração do Ambiente de Desenvolvimento

### Pré-requisitos

- Node.js (versão 18.x ou superior)
- NPM (versão 9.x ou superior)

### Instalação

1. Clone o repositório:

```bash
git clone [URL_DO_REPOSITORIO]
cd editais-comercial
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env`
   - Preencha os valores das variáveis no arquivo `.env`

### Executando o projeto

1. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

2. Acesse o aplicativo em [http://localhost:3000](http://localhost:3000)

### Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run preview` - Visualiza o build de produção localmente

## Estrutura do Projeto

/editais-comercial
├── .env                          # Variáveis de ambiente para desenvolvimento
├── .env.production               # Variáveis de ambiente para produção
├── .gitignore                    # Arquivos ignorados pelo git
├── .vscode/                      # Configurações do VS Code
│   └── extensions.json           # Extensões recomendadas
├── README.md                     # Documentação principal
├── IMPUGNACOES.MD                # Documentação sobre impugnações
├── package.json                  # Dependências e scripts do projeto
├── vite.config.js                # Configuração do Vite (bundler)
├── jsconfig.json                 # Configuração do JavaScript para o editor
├── vercel.json                   # Configuração para deploy na Vercel
├── docker-compose.yml            # Configuração do Docker Compose
├── index.html                    # Ponto de entrada HTML
├── config.js                     # Configurações gerais
├── service-worker.js             # Service Worker para PWA
├── src/                          # Código-fonte principal do frontend
│   ├── api/                      # Funções de comunicação com APIs
│   │   └── index.js              # Exportações principais da API
│   ├── App.vue                   # Componente raiz do Vue
│   ├── main.js                   # Ponto de entrada JavaScript
│   ├── assets/                   # Arquivos estáticos
│   │   ├── images/               # Imagens utilizadas
│   │   └── styles/               # Estilos CSS
│   ├── components/               # Componentes reutilizáveis
│   │   ├── EditaisTable.vue      # Tabela de editais
│   │   ├── ProcessosTable.vue    # Tabela de processos
│   │   ├── PlataformasTable.vue  # Tabela de plataformas
│   │   ├── LancesTable.vue       # Tabela de lances
│   │   ├── SistemasTable.vue     # Tabela de sistemas
│   │   ├── TheSidebar.vue        # Componente de barra lateral
│   │   └── RequiredLabel.vue     # Label para campos obrigatórios
│   ├── composables/              # Lógica reutilizável
│   │   ├── useAuth.js            # Hook para autenticação
│   │   ├── useVisibilityHandler.js # Hook para visibilidade
│   │   └── useConnectionManager.js # Hook para gerenciar conexão
│   ├── data/                     # Dados estáticos
│   │   └── coordenadasMunicipios.ts # Coordenadas dos municípios
│   ├── lib/                      # Bibliotecas e configurações
│   │   ├── supabase.js           # Cliente Supabase
│   │   └── supabaseManager.js    # Gerenciador de Supabase
│   ├── router/                   # Configuração do Vue Router
│   │   └── index.js              # Definição das rotas
│   ├── services/                 # Serviços para comunicação com APIs
│   │   ├── api.js                # Serviço de API principal
│   │   └── ibgeService.js        # Serviço para dados do IBGE
│   ├── styles/                   # Estilos CSS globais
│   │   └── main.css              # Estilos principais
│   ├── types/                    # Definições de tipos
│   │   └── index.d.ts            # Tipos principais
│   ├── utils/                    # Funções utilitárias
│   │   ├── auth.js               # Utilitários de autenticação
│   │   ├── distance.js           # Cálculo de distâncias
│   │   └── googleMapsService.js  # Integração com Google Maps
│   └── views/                    # Componentes de página
│       ├── HomeView.vue          # Página inicial/Dashboard
│       ├── LoginView.vue         # Página de login
│       ├── ResetPassword.vue     # Recuperação de senha
│       ├── EditaisView.vue       # Cadastro e edição de editais
│       ├── ProcessosView.vue     # Gerenciamento de processos
│       ├── PlataformasView.vue   # Gerenciamento de plataformas
│       ├── LancesView.vue        # Gerenciamento de lances
│       ├── SistemasView.vue      # Gerenciamento de sistemas
│       ├── EmpresasView.vue      # Gerenciamento de empresas
│       ├── RepresentantesView.vue # Gerenciamento de representantes
│       ├── RelatoriosView.vue    # Visualização de relatórios
│       ├── FuncionalidadesView.vue # Funcionalidades do sistema
│       └── ConfiguracoesView.vue # Configurações do sistema
├── public/                       # Arquivos estáticos públicos
│   ├── favicon.ico               # Ícone do site
│   ├── index.html                # HTML principal
│   ├── robots.txt                # Configuração para crawlers
│   ├── service-worker.js         # Service Worker para PWA
│   └── icons/                    # Ícones do sistema
│       ├── icon-192.png          # Ícone 192x192
│       ├── icon-512.png          # Ícone 512x512
│       ├── links.svg             # Ícone para plataformas
│       ├── empresa.svg           # Ícone para empresas
│       ├── check.svg             # Ícone para relatórios
│       ├── config-usuario.svg    # Ícone para configurações
│       ├── certificado.svg       # Ícone para processos
│       ├── calculadora.svg       # Ícone para lances
│       ├── app.svg               # Ícone para sistemas
│       ├── grafico.svg           # Ícone para dashboard
│       └── cartao-usuario.svg    # Ícone para representantes
├── backend/                      # Código do backend
│   ├── package.json              # Dependências do backend
│   └── src/                      # Código-fonte do backend
│       ├── config/               # Configurações
│       ├── middleware/           # Middlewares Express
│       ├── routes/               # Rotas da API
│       ├── services/             # Serviços de negócio
│       ├── utils/                # Funções utilitárias
│       └── index.js              # Ponto de entrada do backend
└── scripts/                      # Scripts utilitários
    └── baixarCoordenadas.js      # Script para baixar coordenadas
