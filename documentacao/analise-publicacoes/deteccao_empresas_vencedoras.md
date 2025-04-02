# Funcionalidade: Detecção de Empresas Vencedoras

## Descrição

Esta funcionalidade analisa o texto da publicação para identificar empresas mencionadas como vencedoras ou contratadas. O sistema compara o texto com uma base de dados de empresas cadastradas e identifica correspondências.

## Fluxo da Funcionalidade

```mermaid
sequenceDiagram
    actor U as Usuário
    participant P as Processo View
    participant A as usePublicationAnalysis
    participant DB as Database
    
    U->>P: Submete publicação para análise
    P->>A: extrairEmpresaVencedora(texto)
    
    A->>A: Inicia processamento (analisando=true)
    
    A->>DB: Carrega empresas cadastradas
    DB-->>A: Lista de empresas
    
    A->>A: Busca padrões de empresas vencedoras no texto
    
    alt Encontrou padrão de empresa
        A->>A: Extrai nome ou CNPJ mencionado
        
        loop Para cada empresa cadastrada
            A->>A: Compara com empresas cadastradas
            
            alt Encontrou correspondência por nome
                A->>A: Registra ID da empresa encontrada
            else Encontrou correspondência por CNPJ
                A->>A: Normaliza CNPJs para comparação
                A->>A: Registra ID da empresa encontrada
            end
        end
        
        A-->>P: Retorna ID da empresa identificada
    else Não encontrou padrão de empresa
        A-->>P: Retorna null
    end
    
    A->>A: Finaliza processamento (analisando=false)
    
    P->>P: Atualiza formulário com empresa identificada
    P-->>U: Exibe empresa identificada para confirmação
    
    alt Usuário confirma
        U->>P: Confirma empresa vencedora
        P->>DB: Atualiza empresa_vencedora no processo
        DB-->>P: Confirma atualização
    else Usuário corrige
        U->>P: Seleciona empresa correta
        P->>DB: Atualiza empresa_vencedora no processo
        DB-->>P: Confirma atualização
        
        P->>DB: Registra feedback para aprendizado
    end
```

## Interface de Usuário

- Campo no formulário mostrando a empresa detectada automaticamente
- Dropdown para selecionar outra empresa se a detecção for incorreta
- Indicador visual de confiança na detecção
- Opção para registrar nova empresa caso não esteja cadastrada

## Padrões de Detecção

O sistema busca padrões específicos no texto que indicam uma empresa vencedora:

```javascript
// Padrões para identificar empresas vencedoras
const padraoEmpresa = /empresa[\s.:]*(?:vencedora|contratada|adjudicada)[\s.:]*([^,.\n]+)/i;
const padraoCnpj = /cnpj[\s.:]*(\d{2}[\.\-\/]?\d{3}[\.\-\/]?\d{3}[\.\-\/]?\d{4}[\.\-\/]?\d{2})/i;
```

## Algoritmo de Correspondência

```mermaid
flowchart TD
    A[Iniciar Análise] --> B{Encontrou padrão\nde empresa?}
    B -->|Sim| C[Extrair nome\nou CNPJ]
    B -->|Não| D[Retornar null]
    
    C --> E{É CNPJ?}
    E -->|Sim| F[Normalizar CNPJ\nremover pontuação]
    E -->|Não| G[Comparar nome\ncom empresas]
    
    F --> H[Comparar CNPJ\ncom empresas]
    
    G --> I{Encontrou\ncorrespondência?}
    H --> I
    
    I -->|Sim| J[Retornar ID\nda empresa]
    I -->|Não| D
    
    J --> K[Fim]
    D --> K
```

## Dados Armazenados

### Tabela: processos (Coluna relevante)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| empresa_vencedora | uuid | ID da empresa vencedora identificada |
| numero_contrato | varchar | Número do contrato associado (também pode ser extraído) |

### Tabela: empresas

Tabela consultada para identificar empresas:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único da empresa |
| nome | varchar | Nome comercial da empresa |
| razao_social | varchar | Razão social completa |
| cnpj | varchar | CNPJ formatado |
| email | varchar | Email de contato |
| telefone | varchar | Telefone de contato |

## Implementação

```javascript
// Extrair informações de empresa vencedora
const extrairEmpresaVencedora = async (texto) => {
  try {
    analisando.value = true;
    
    // Carregar empresas para comparação
    const { data: empresas } = await supabase
      .from('empresas')
      .select('id, nome, cnpj, razao_social');
    
    if (!empresas || !empresas.length) return null;
    
    // Procurar por padrões de texto que indiquem empresa vencedora
    const padraoEmpresa = /empresa[\s.:]*(?:vencedora|contratada|adjudicada)[\s.:]*([^,.\n]+)/i;
    const padraoCnpj = /cnpj[\s.:]*(\d{2}[\.\-\/]?\d{3}[\.\-\/]?\d{3}[\.\-\/]?\d{4}[\.\-\/]?\d{2})/i;
    
    const matchEmpresa = texto.match(padraoEmpresa);
    const matchCnpj = texto.match(padraoCnpj);
    
    if (matchEmpresa || matchCnpj) {
      // Buscar correspondência por nome ou CNPJ
      const empresaEncontrada = empresas.find(empresa => {
        if (matchEmpresa && empresa.nome && matchEmpresa[1].includes(empresa.nome)) {
          return true;
        }
        
        if (matchCnpj) {
          const cnpjTexto = matchCnpj[1].replace(/[\.\-\/]/g, '');
          const cnpjEmpresa = empresa.cnpj.replace(/[\.\-\/]/g, '');
          return cnpjTexto === cnpjEmpresa;
        }
        
        return false;
      });
      
      return empresaEncontrada?.id || null;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao extrair empresa vencedora:', error);
    erro.value = error;
    return null;
  } finally {
    analisando.value = false;
  }
};
```

## Extração de Número de Contrato

Junto com a empresa vencedora, o sistema também tenta extrair o número do contrato:

```javascript
// Extrair número de contrato
const extrairNumeroContrato = (texto) => {
  try {
    // Padrões comuns para números de contrato
    const padroes = [
      /contrato[\s.:]*(?:n[º°\.ºo]|número|nro|numero)[\s.:]*(\d+[\/-]?\d*)/i,
      /(?:n[º°\.ºo]|número|nro|numero)[\s.:]*(?:do contrato|contrato)[\s.:]*(\d+[\/-]?\d*)/i,
      /(?:contrato)[\s.:]*(\d+[\/-]?\d*)/i
    ];
    
    for (const padrao of padroes) {
      const match = texto.match(padrao);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao extrair número do contrato:', error);
    erro.value = error;
    return null;
  }
};
```

## Aplicação dos Resultados

Os resultados da análise podem ser aplicados ao processo:

```javascript
// Aplicar resultados da análise ao processo
const aplicarResultadosAnalise = async (processoId, resultados) => {
  if (!processoId || !resultados) return false;
  
  try {
    const atualizacoes = {};
    
    if (resultados.empresa_vencedora) {
      atualizacoes.empresa_vencedora = resultados.empresa_vencedora;
    }
    
    if (resultados.numero_contrato) {
      atualizacoes.numero_contrato = resultados.numero_contrato;
    }
    
    if (Object.keys(atualizacoes).length === 0) return false;
    
    const { error } = await supabase
      .from('processos')
      .update(atualizacoes)
      .eq('id', processoId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Erro ao aplicar resultados:', error);
    erro.value = error;
    return false;
  }
};
```
