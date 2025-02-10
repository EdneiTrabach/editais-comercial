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
