✅ Prompt para salvar um relatório estruturado como JSON no banco de dados:
Crie uma estrutura de JSON que represente integralmente os dados do Relatório / Termo de Autorização e da Checklist de Licitações, conforme os modelos fornecidos. O conteúdo será salvo na tabela relatorios_processos na coluna conteudo, utilizando o campo conteudo como um JSON.stringify(data) com todos os dados organizados de forma editável.

📦 Estrutura Sugerida do JSON
json
Copiar
Editar
{
  "informacoes_gerais": {
    "local_data": "Domingos Martins-ES, -- de ---- de ----",
    "cliente_prospect": "Cliente",
    "objeto": "",
    "modalidade_tipo": "",
    "data_hora_licitacao": "",
    "prazo_vigencia": "",
    "esclarecimentos": "",
    "visita_antes_licitacao": "",
    "incluir_docs_com_preco": "",
    "julgamento_lances": "",
    "banco_dados": "",
    "valor_estimado": "",
    "valor_proposta": "",
    "percentual_que_atendemos": "",
    "itens_impugnativeis": "",
    "valor_atual_concorrente": "",
    "nome_concorrente_assessoria": "",
    "distancia_filiais_habitantes": "",
    "informacoes_adicionais": "",
    "periodicidade_visitas": "",
    "pede_demonstracao": "",
    "multas": "",
    "prazo_implantacao": "",
    "sistemas_a_implantar": "",
    "implantacao_treinamento_migracao": "",
    "prazo_recurso_legal": "",
    "condicao_reajuste": "",
    "impedimentos_participacao": {
      "documental": "",
      "tecnica": ""
    },
    "participacao": {
      "participar": true,
      "nao_participar_motivo": ""
    },
    "autorizado_por": {
      "nome_1": "Suzany Medeiros Leite",
      "cargo_1": "Gerente Comercial",
      "nome_2": "Estevão Henrique Holz",
      "cpf_2": "979.001.257-87"
    }
  },
  "checklist_licitacoes": {
    "cliente_prospect": "",
    "modalidade_tipo": "",
    "tarefas": [
      {
        "categoria": "GERAL",
        "itens": [
          { "descricao": "Verificar se existe visita técnica", "preparacao": true, "conferencia": true, "coordenador": false },
          { "descricao": "Verificar necessidade de cadastro", "preparacao": true, "conferencia": false, "coordenador": false }
          // ... mais tarefas ...
        ]
      },
      {
        "categoria": "CREDENCIAMENTO",
        "itens": [
          { "descricao": "Verificar se está de acordo com modelo", "preparacao": true, "conferencia": true, "coordenador": true }
          // ...
        ]
      },
      {
        "categoria": "HABILITAÇÃO",
        "itens": [
          { "descricao": "Conferência de documentos", "preparacao": false, "conferencia": true, "coordenador": false }
          // ...
        ]
      },
      {
        "categoria": "PROPOSTA TÉCNICA",
        "itens": [
          { "descricao": "Leitura das entrelinhas do TR", "preparacao": false, "conferencia": false, "coordenador": true }
        ]
      },
      {
        "categoria": "PROPOSTA DE PREÇOS",
        "itens": [
          { "descricao": "Verificar validade da proposta", "preparacao": true, "conferencia": true, "coordenador": true }
        ]
      }
    ],
    "nome_funcionario_preparou": ""
  }
}
💾 Como salvar no Supabase
js
Copiar
Editar
import { supabase } from '@/lib/supabaseClient'

async function salvarRelatorioProcesso(processoId, conteudoJson, usuarioId) {
  const { error } = await supabase
    .from('relatorios_processos')
    .upsert({
      processo_id: processoId,
      conteudo: JSON.stringify(conteudoJson),
      criado_por: usuarioId,
      atualizado_em: new Date().toISOString(),
      finalizado: false
    }, { onConflict: ['processo_id'] });

  if (error) {
    throw new Error(`Erro ao salvar relatório: ${error.message}`);
  }
}
🧠 Benefícios dessa abordagem
Permite edição parcial e contínua de qualquer campo

Torna simples converter o JSON em HTML para o editor visual

Facilita geração de PDF formatado

Compatível com salvamento automático e versionamento