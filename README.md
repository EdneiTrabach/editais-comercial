# Sistema de Editais Comerciais

## 📋 Sobre o Projeto
Sistema desenvolvido para gerenciamento de editais comerciais, permitindo o cadastro, consulta e acompanhamento de processos licitatórios.

## 🚀 Tecnologias Utilizadas

### Backend
- Node.js
- Express.js
- PostgreSQL
- JSON Web Token (JWT)
- BCrypt
- CORS
- Dotenv

### Segurança
- Autenticação via JWT
- Senha criptografada com BCrypt
- Proteção contra CORS
- Variáveis de ambiente

## 🛠️ Configuração do Ambiente

### Pré-requisitos
- Node.js
- PostgreSQL
- NPM ou Yarn

### Instalação e Execução
1. Clone o repositório
```bash
git clone [url-do-repositorio]
```

2. Acesse a pasta do backend
```bash
cd backend
```

3. Instale as dependências
```bash
npm install
```

4. Configure as variáveis de ambiente
Crie um arquivo .env na raiz do projeto com as seguintes variáveis:
```
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_banco
JWT_SECRET=sua_chave_secreta
PORT=3000
```

5. Execute o projeto
```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

## 🔒 Endpoints da API

### Autenticação
- POST /auth/login - Login do usuário
- POST /auth/register - Registro de novo usuário

### Editais
- GET /editais - Lista todos os editais
- POST /editais - Cria novo edital
- PUT /editais/:id - Atualiza edital
- DELETE /editais/:id - Remove edital

## 👥 Controle de Acesso
O sistema possui controle de acesso baseado em roles:
- Administrador: Acesso total
- Usuário: Acesso limitado a consultas

## 📝 Licença
Este projeto está sob a licença MIT.





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

    
    
