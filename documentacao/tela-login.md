# Documentação da Tela de Login

## Visão Geral
A tela de login do Sistema de Editais Comerciais foi projetada para proporcionar uma experiência moderna, intuitiva e emocionalmente conectada com o usuário. O design combina elementos visuais atrativos com funcionalidades práticas para garantir segurança e usabilidade.

## Componentes Principais

### Estrutura Visual
A tela é dividida em duas seções principais:

1. **Painel de Ilustração** - Lado esquerdo com uma ilustração relacionada a login
2. **Painel de Formulário** - Lado direito contendo os campos de entrada e botões

```mermaid
graph LR
    A[Tela de Login] --> B[Painel de Ilustração]
    A --> C[Painel de Formulário]
    B --> D[SVG Ilustrativo]
    C --> E[Logo da Empresa]
    C --> F[Formulário de Login]
    C --> G[Rodapé]
    F --> H[Campo de Email]
    F --> I[Campo de Senha]
    F --> J[Link Esqueceu Senha]
    F --> K[Botão Entrar]
```

### Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Formulário
    participant V as Validação
    participant S as Supabase Auth
    participant R as Router

    U->>F: Preenche Credenciais
    U->>F: Clica em Entrar
    F->>V: Valida Entradas
    
    alt Validação falha
        V->>F: Exibe Erros
    else Validação passa
        V->>S: Envia Credenciais
        alt Autenticação falha
            S->>F: Retorna Erro
            F->>U: Exibe Mensagem de Erro
        else Autenticação sucesso
            S->>F: Retorna Dados do Usuário
            F->>R: Redireciona para Home
        end
    end
```

### Fluxo de Recuperação de Senha

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Formulário
    participant M as Modal Reset
    participant S as Supabase Auth
    
    U->>F: Clica "Esqueceu Senha"
    F->>M: Abre Modal Reset
    U->>M: Preenche Email
    M->>S: Solicita Reset
    S->>M: Confirma Envio
    M->>U: Exibe Confirmação
```

## Estados da Interface

```mermaid
stateDiagram-v2
    [*] --> Inicial
    Inicial --> Preenchendo: Usuário começa a digitar
    Preenchendo --> Validando: Submissão do formulário
    
    Validando --> ErroValidacao: Entrada inválida
    ErroValidacao --> Preenchendo: Correção de entrada
    
    Validando --> Autenticando: Entrada válida
    Autenticando --> ErroAutenticacao: Credenciais incorretas
    ErroAutenticacao --> Preenchendo: Nova tentativa
    
    Autenticando --> Autenticado: Sucesso no login
    Autenticado --> [*]: Redirecionamento
    
    Inicial --> RecuperacaoSenha: Clique em "Esqueceu senha"
    RecuperacaoSenha --> EnvioEmail: Submissão de email
    EnvioEmail --> Inicial: Confirmação de envio
```

## Responsividade
A interface foi projetada seguindo princípios de design responsivo para garantir uma experiência consistente em diferentes tamanhos de tela:

- **Desktop**: Layout com dois painéis lado a lado
- **Tablet**: Mantém o layout de dois painéis com ajustes de proporção
- **Mobile**: Converte para layout vertical, com ilustração acima do formulário
- **Mobile Landscape**: Ajusta para melhor visualização em orientação horizontal

```mermaid
flowchart TD
    A[Responsive Layout] --> B{Tamanho da Tela?}
    B -->|> 992px| C[Desktop Layout]
    B -->|768-992px| D[Tablet Layout]
    B -->|< 768px| E[Mobile Layout]
    E -->|Orientação?| F{Verificar Orientação}
    F -->|Portrait| G[Mobile Vertical]
    F -->|Landscape| H[Mobile Horizontal]
```

## Elementos de Design

### Visuais
- **Cores principais**: Gradientes de azul (#193155 a #254677)
- **Efeitos visuais**: Animações sutis, efeito de pulso, grid dinâmico
- **Tipografia**: Família Roboto para melhor legibilidade
- **Ilustração**: Arte SVG relacionada a login para conexão emocional com o usuário

### Interações
- Input com labels flutuantes para melhor UX
- Animações de transição suaves
- Feedback visual em tempo real durante validações
- Notificações toast para comunicação de status

## Segurança
- Validação de entrada no cliente
- Armazenamento seguro de tokens via Supabase
- Opção de recuperação de senha
- Redirecionamento após autenticação

## Tecnologias Utilizadas
- Vue.js 3 com Composition API
- Supabase para autenticação
- CSS com animações e transições personalizadas
- SVG para ilustrações

## Considerações de Acessibilidade
- Contraste adequado entre texto e fundo
- Tamanhos de fonte ajustáveis
- Feedback visual e mensagens de erro claras
- Navegação por teclado suportada
- Estrutura semântica adequada
