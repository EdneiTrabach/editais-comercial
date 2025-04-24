<template>
  <div class="relatorio-container">
    <RelatorioHeader 
      :titulo="'Relatório / Termo de Autorização'"
      :loading="false"
      @voltar="voltar"
      @exportar="exportarPDF"
    />
    
    <div class="relatorio-content">
      <!-- Formulário principal -->
      <div class="formulario-container">
        <!-- Seção de cabeçalho -->
        <div class="secao cabecalho">
          <div class="local-data">
            <input 
              type="text" 
              v-model="formData.localData" 
              placeholder="Domingos Martins-ES, __ de ______ de ____" 
              class="input-transparente"
            />
          </div>
          
          <h1 class="titulo-relatorio">RELATÓRIO / TERMO DE AUTORIZAÇÃO</h1>
          
          <div class="tipo-cliente">
            <label class="checkbox-container">
              <input type="checkbox" v-model="formData.isCliente">
              <span class="checkbox-text">Cliente</span>
            </label>
            
            <label class="checkbox-container ml-4">
              <input type="checkbox" v-model="formData.isProspect">
              <span class="checkbox-text">Prospect</span>
            </label>
          </div>
        </div>
        
        <!-- Seção de Informações Gerais -->
        <div class="secao info-gerais">
          <div class="grid-2">
            <div class="form-group">
              <label>Objeto</label>
              <input type="text" v-model="formData.objeto" class="form-control" />
            </div>
            
            <div class="form-group">
              <label>Modalidade/Tipo</label>
              <input type="text" v-model="formData.modalidadeTipo" class="form-control" />
            </div>
          </div>
          
          <div class="grid-2">
            <div class="form-group">
              <label>Data/Hora da licitação</label>
              <input type="text" v-model="formData.dataHoraLicitacao" class="form-control" />
            </div>
            
            <div class="form-group">
              <label>Prazo de Vigência</label>
              <input type="text" v-model="formData.prazoVigencia" class="form-control" />
            </div>
          </div>
        </div>
        
        <!-- Seção de Campos de Texto -->
        <div class="secao campos-texto">
          <div class="form-group">
            <label>Esclarecimentos</label>
            <textarea v-model="formData.esclarecimentos" class="form-control" rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label>Visita antes da licitação</label>
            <textarea v-model="formData.visitaPreLicitacao" class="form-control" rows="2"></textarea>
          </div>
          
          <div class="grid-2">
            <div class="form-group">
              <label>Incluir docs de habilitação com preço?</label>
              <textarea v-model="formData.docsHabilitacao" class="form-control" rows="2"></textarea>
            </div>
            
            <div class="form-group">
              <label>Julgamento lances</label>
              <textarea v-model="formData.julgamentoLances" class="form-control" rows="2"></textarea>
            </div>
          </div>
          
          <div class="grid-2">
            <div class="form-group">
              <label>Banco de Dados</label>
              <textarea v-model="formData.bancoDados" class="form-control" rows="2"></textarea>
            </div>
            
            <div class="form-group">
              <label>Valor Estimado do Edital</label>
              <input type="text" v-model="formData.valorEstimadoEdital" class="form-control" />
            </div>
          </div>
          
          <div class="grid-2">
            <div class="form-group">
              <label>Valor (Proposta de Preços)</label>
              <input type="text" v-model="formData.valorProposta" class="form-control" />
            </div>
            
            <div class="form-group">
              <label>% que atendemos no edital</label>
              <input type="text" v-model="formData.percentualAtendimento" class="form-control" />
            </div>
          </div>
          
          <div class="form-group">
            <label>Itens Impugnáveis</label>
            <textarea v-model="formData.itensImpugnaveis" class="form-control" rows="3"></textarea>
          </div>
          
          <div class="grid-2">
            <div class="form-group">
              <label>Valor Atual concorrente</label>
              <input type="text" v-model="formData.valorConcorrente" class="form-control" />
            </div>
            
            <div class="form-group">
              <label>Nome do concorrente e assessoria</label>
              <input type="text" v-model="formData.nomeConcorrente" class="form-control" />
            </div>
          </div>
          
          <div class="form-group">
            <label>Distância das filiais e nº. Habitantes</label>
            <textarea v-model="formData.distanciaFiliais" class="form-control" rows="2"></textarea>
          </div>
          
          <div class="form-group">
            <label>Informações Adicionais</label>
            <textarea v-model="formData.infoAdicionais" class="form-control" rows="3"></textarea>
          </div>
          
          <div class="grid-2">
            <div class="form-group">
              <label>Periodicidade de visitas</label>
              <input type="text" v-model="formData.periodicidadeVisitas" class="form-control" />
            </div>
            
            <div class="form-group">
              <label>Pede demonstração</label>
              <input type="text" v-model="formData.pedeDemonstracao" class="form-control" />
            </div>
          </div>
          
          <div class="form-group">
            <label>MULTAS</label>
            <textarea v-model="formData.multas" class="form-control" rows="2"></textarea>
          </div>
          
          <div class="grid-2">
            <div class="form-group">
              <label>Prazo de Implantação</label>
              <input type="text" v-model="formData.prazoImplantacao" class="form-control" />
            </div>
            
            <div class="form-group">
              <label>Prazo de recurso legal</label>
              <input type="text" v-model="formData.prazoRecurso" class="form-control" />
            </div>
          </div>
          
          <div class="form-group">
            <label>Sistemas a serem implantados (se cliente)</label>
            <textarea v-model="formData.sistemasImplantados" class="form-control" rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label>Cotação obrigatória de implantação/treinamento/migração</label>
            <textarea v-model="formData.cotacaoObrigatoria" class="form-control" rows="2"></textarea>
          </div>
          
          <div class="form-group">
            <label>Condição de reajuste</label>
            <textarea v-model="formData.condicaoReajuste" class="form-control" rows="2"></textarea>
          </div>
          
          <div class="form-group">
            <label>O que impede de participarmos</label>
            <div class="sub-campos">
              <div class="form-group">
                <label>Documental</label>
                <textarea v-model="formData.impedeDocumental" class="form-control" rows="2"></textarea>
              </div>
              
              <div class="form-group">
                <label>Técnica</label>
                <textarea v-model="formData.impedeTecnica" class="form-control" rows="2"></textarea>
              </div>
            </div>
          </div>
          
          <div class="participacao">
            <h3>Parecer sobre participação</h3>
            <div class="opcoes-participacao">
              <label class="radio-container">
                <input type="radio" v-model="formData.participar" :value="true" name="participacao">
                <span class="radio-text">Participar</span>
              </label>
              
              <label class="radio-container ml-4">
                <input type="radio" v-model="formData.participar" :value="false" name="participacao">
                <span class="radio-text">Não participar</span>
              </label>
            </div>
            
            <div v-if="formData.participar === false" class="form-group">
              <label>Motivo</label>
              <textarea v-model="formData.motivoNaoParticipar" class="form-control" rows="2"></textarea>
            </div>
          </div>
        </div>
        
        <!-- Seção de Assinaturas -->
        <div class="secao assinaturas">
          <h3>Assinaturas</h3>
          
          <div class="grid-2">
            <div class="assinatura-campo">
              <div class="linha-assinatura"></div>
              <p class="nome-assinatura">Suzany Medeiros Leite</p>
              <p class="cargo-assinatura">Gerente Comercial</p>
            </div>
            
            <div class="assinatura-campo">
              <div class="linha-assinatura"></div>
              <p class="nome-assinatura">Estevão Henrique Holz</p>
              <p class="cargo-assinatura">CPF: 979.001.257-87</p>
            </div>
          </div>
        </div>
        
        <!-- Check List Licitações -->
        <div class="secao check-list">
          <h2>Check List Licitações</h2>
          
          <table class="check-table">
            <thead>
              <tr>
                <th>Tarefa</th>
                <th>Preparação</th>
                <th>Conferência</th>
                <th>Conf. Coordenador</th>
              </tr>
            </thead>
            <tbody>
              <!-- Seção GERAL -->
              <tr class="categoria">
                <td colspan="4">GERAL</td>
              </tr>
              <tr v-for="(item, index) in checklistGeral" :key="`geral-${index}`">
                <td>{{ item.tarefa }}</td>
                <td class="check-cell"><input type="checkbox" v-model="item.preparacao"></td>
                <td class="check-cell"><input type="checkbox" v-model="item.conferencia"></td>
                <td class="check-cell"><input type="checkbox" v-model="item.coordenador"></td>
              </tr>
              
              <!-- Seção CREDENCIAMENTO -->
              <tr class="categoria">
                <td colspan="4">CREDENCIAMENTO</td>
              </tr>
              <tr v-for="(item, index) in checklistCredenciamento" :key="`cred-${index}`">
                <td>{{ item.tarefa }}</td>
                <td class="check-cell"><input type="checkbox" v-model="item.preparacao"></td>
                <td class="check-cell"><input type="checkbox" v-model="item.conferencia"></td>
                <td class="check-cell"><input type="checkbox" v-model="item.coordenador"></td>
              </tr>
              
              <!-- Seção HABILITAÇÃO -->
              <tr class="categoria">
                <td colspan="4">HABILITAÇÃO</td>
              </tr>
              <tr v-for="(item, index) in checklistHabilitacao" :key="`hab-${index}`">
                <td>{{ item.tarefa }}</td>
                <td class="check-cell"><input type="checkbox" v-model="item.preparacao"></td>
                <td class="check-cell"><input type="checkbox" v-model="item.conferencia"></td>
                <td class="check-cell"><input type="checkbox" v-model="item.coordenador"></td>
              </tr>
              
              <!-- Seção PROPOSTA TÉCNICA -->
              <tr class="categoria">
                <td colspan="4">PROPOSTA TÉCNICA</td>
              </tr>
              <tr v-for="(item, index) in checklistPropostaTecnica" :key="`tec-${index}`">
                <td>{{ item.tarefa }}</td>
                <td class="check-cell"><input type="checkbox" v-model="item.preparacao"></td>
                <td class="check-cell"><input type="checkbox" v-model="item.conferencia"></td>
                <td class="check-cell"><input type="checkbox" v-model="item.coordenador"></td>
              </tr>
              
              <!-- Seção PROPOSTA DE PREÇOS -->
              <tr class="categoria">
                <td colspan="4">PROPOSTA DE PREÇOS</td>
              </tr>
              <tr v-for="(item, index) in checklistPropostaPrecos" :key="`preco-${index}`">
                <td>{{ item.tarefa }}</td>
                <td class="check-cell"><input type="checkbox" v-model="item.preparacao"></td>
                <td class="check-cell"><input type="checkbox" v-model="item.conferencia"></td>
                <td class="check-cell"><input type="checkbox" v-model="item.coordenador"></td>
              </tr>
            </tbody>
          </table>
          
          <!-- Responsável pela conferência -->
          <div class="responsavel-conferencia">
            <div class="form-group">
              <label>Nome do funcionário que preparou e conferiu a licitação</label>
              <input type="text" v-model="formData.responsavelConferencia" class="form-control" />
            </div>
          </div>
        </div>
        
        <!-- Botões de ação -->
        <div class="acoes-form">
          <button class="btn btn-primary" @click="salvar">Salvar</button>
          <button class="btn btn-secondary" @click="exportarPDF">Exportar PDF</button>
          <button class="btn btn-warning" @click="exportarWord">Exportar Word</button>
          <button class="btn btn-danger" @click="limparForm">Limpar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import RelatorioHeader from '@/components/relatorios/RelatorioHeader/index.vue';
import { exportToPDF } from '@/utils/exportRelatorioUtils';
import { supabase } from '@/lib/supabase';

export default {
  name: 'RelatorioTermoAutorizacaoView',
  
  components: {
    RelatorioHeader
  },
  
  setup() {
    const router = useRouter();
    const formData = ref({
      // Cabeçalho
      localData: '',
      isCliente: false,
      isProspect: false,
      
      // Informações Gerais
      objeto: '',
      modalidadeTipo: '',
      dataHoraLicitacao: '',
      prazoVigencia: '',
      
      // Campos de texto 
      esclarecimentos: '',
      visitaPreLicitacao: '',
      docsHabilitacao: '',
      julgamentoLances: '',
      bancoDados: '',
      valorEstimadoEdital: '',
      valorProposta: '',
      percentualAtendimento: '',
      itensImpugnaveis: '',
      valorConcorrente: '',
      nomeConcorrente: '',
      distanciaFiliais: '',
      infoAdicionais: '',
      periodicidadeVisitas: '',
      pedeDemonstracao: '',
      multas: '',
      prazoImplantacao: '',
      sistemasImplantados: '',
      cotacaoObrigatoria: '',
      prazoRecurso: '',
      condicaoReajuste: '',
      impedeDocumental: '',
      impedeTecnica: '',
      participar: null,
      motivoNaoParticipar: '',
      
      // Responsável
      responsavelConferencia: ''
    });
    
    // Checklist - Sessão GERAL
    const checklistGeral = ref([
      { 
        tarefa: 'Verificar se existe visita técnica', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Verificar necessidade de atestado em conselhos regionais', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Cadastro de fornecedor', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Exigência de profissionais indisponíveis', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Compatibilidade dos sistemas licitados', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Verificar valores estimados', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Verificar banco de dados', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      }
    ]);
    
    // Checklist - Sessão CREDENCIAMENTO
    const checklistCredenciamento = ref([
      { 
        tarefa: 'Conferir modelo', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Conferir data/nome do credenciado', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Conferir modalidade/número do edital', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Conferir procuração do representante', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      }
    ]);
    
    // Checklist - Sessão HABILITAÇÃO
    const checklistHabilitacao = ref([
      { 
        tarefa: 'Conferir documentos conforme edital', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Conferir datas de certidões', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Conferir declarações com reconhecimento de firma', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Conferir se declarações estão conforme modelo', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Verificar declarações ocultas nos anexos', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Certidões negativas ou com efeito de negativa', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      }
    ]);
    
    // Checklist - Sessão PROPOSTA TÉCNICA
    const checklistPropostaTecnica = ref([
      { 
        tarefa: 'Ler entrelinhas do TR para exigências ocultas', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Verificar se impressão de descritivos está correta', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      }
    ]);
    
    // Checklist - Sessão PROPOSTA DE PREÇOS
    const checklistPropostaPrecos = ref([
      { 
        tarefa: 'Verificar número de vias', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Conferir validade da proposta', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Itens da proposta devem coincidir com TR/contrato', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      },
      { 
        tarefa: 'Valor dentro do estimado', 
        preparacao: false, 
        conferencia: false, 
        coordenador: false 
      }
    ]);
    
    // Funções de navegação e ações
    const voltar = () => {
      router.back();
    };
    
    const exportarPDF = async () => {
      try {
        // Montar o conteúdo HTML para exportação
        const conteudoRelatorio = gerarConteudoRelatorio();
        
        // Chamar a função de exportação para PDF
        await exportToPDF({
          conteudo: conteudoRelatorio,
          processo: { numero_processo: formData.value.objeto },
          nomeArquivo: `Termo_Autorizacao_${new Date().toISOString().split('T')[0]}.pdf`
        });
        
        alert('PDF exportado com sucesso!');
      } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        alert('Erro ao exportar PDF. Verifique o console para mais detalhes.');
      }
    };
    
    const exportarWord = () => {
      try {
        // Implementar exportação para Word (pode ser usado APIs como FileSaver.js)
        alert('Função de exportação para Word em implementação.');
      } catch (error) {
        console.error('Erro ao exportar para Word:', error);
        alert('Erro ao exportar para Word.');
      }
    };
    
    const gerarConteudoRelatorio = () => {
      // Criar HTML para o relatório completo
      let html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <div style="text-align: right; margin-bottom: 20px;">
            <p>${formData.value.localData}</p>
          </div>
          
          <h1 style="text-align: center; margin-bottom: 30px;">RELATÓRIO / TERMO DE AUTORIZAÇÃO</h1>
          
          <div style="margin-bottom: 20px;">
            <label style="margin-right: 20px;">
              <input type="checkbox" ${formData.value.isCliente ? 'checked' : ''}>
              Cliente
            </label>
            <label>
              <input type="checkbox" ${formData.value.isProspect ? 'checked' : ''}>
              Prospect
            </label>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3>Informações Gerais</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="width: 30%; padding: 8px; border-bottom: 1px solid #ddd;"><strong>Objeto:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData.value.objeto}</td>
              </tr>
              <tr>
                <td style="width: 30%; padding: 8px; border-bottom: 1px solid #ddd;"><strong>Modalidade/Tipo:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData.value.modalidadeTipo}</td>
              </tr>
              <tr>
                <td style="width: 30%; padding: 8px; border-bottom: 1px solid #ddd;"><strong>Data/Hora da licitação:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData.value.dataHoraLicitacao}</td>
              </tr>
              <tr>
                <td style="width: 30%; padding: 8px; border-bottom: 1px solid #ddd;"><strong>Prazo de Vigência:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData.value.prazoVigencia}</td>
              </tr>
            </table>
          </div>
      `;
      
      // Adicionar todas as seções de detalhe
      html += `
          <div style="margin-bottom: 20px;">
            <h3>Detalhes</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="width: 30%; padding: 8px; border-bottom: 1px solid #ddd;"><strong>Esclarecimentos:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData.value.esclarecimentos}</td>
              </tr>
              <tr>
                <td style="width: 30%; padding: 8px; border-bottom: 1px solid #ddd;"><strong>Visita antes da licitação:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData.value.visitaPreLicitacao}</td>
              </tr>
              <tr>
                <td style="width: 30%; padding: 8px; border-bottom: 1px solid #ddd;"><strong>Incluir docs de habilitação com preço?</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData.value.docsHabilitacao}</td>
              </tr>
              <tr>
                <td style="width: 30%; padding: 8px; border-bottom: 1px solid #ddd;"><strong>Julgamento lances:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData.value.julgamentoLances}</td>
              </tr>
              <tr>
                <td style="width: 30%; padding: 8px; border-bottom: 1px solid #ddd;"><strong>Banco de Dados:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData.value.bancoDados}</td>
              </tr>
              <tr>
                <td style="width: 30%; padding: 8px; border-bottom: 1px solid #ddd;"><strong>Valor Estimado do Edital:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData.value.valorEstimadoEdital}</td>
              </tr>
              <tr>
                <td style="width: 30%; padding: 8px; border-bottom: 1px solid #ddd;"><strong>Valor (Proposta de Preços):</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData.value.valorProposta}</td>
              </tr>
              <tr>
                <td style="width: 30%; padding: 8px; border-bottom: 1px solid #ddd;"><strong>% que atendemos no edital:</strong></td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData.value.percentualAtendimento}</td>
              </tr>
            </table>
          </div>
      `;
      
      // Adicionar o restante das seções
      
      // Adicionar checklist
      html += `
          <div style="margin-top: 40px;">
            <h2>Check List Licitações</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #ddd;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Tarefa</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Preparação</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Conferência</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Conf. Coordenador</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      // Gerar linhas para cada seção de checklist
      html += gerarLinhasChecklist('GERAL', checklistGeral.value);
      html += gerarLinhasChecklist('CREDENCIAMENTO', checklistCredenciamento.value);
      html += gerarLinhasChecklist('HABILITAÇÃO', checklistHabilitacao.value);
      html += gerarLinhasChecklist('PROPOSTA TÉCNICA', checklistPropostaTecnica.value);
      html += gerarLinhasChecklist('PROPOSTA DE PREÇOS', checklistPropostaPrecos.value);
      
      html += `
              </tbody>
            </table>
          </div>
      `;
      
      // Adicionar seção de assinaturas
      html += `
          <div style="margin-top: 50px; display: flex; justify-content: space-between;">
            <div style="width: 45%; text-align: center;">
              <div style="border-top: 1px solid black; margin-top: 50px;"></div>
              <p style="margin: 5px 0;">Suzany Medeiros Leite</p>
              <p style="margin: 5px 0; font-style: italic;">Gerente Comercial</p>
            </div>
            
            <div style="width: 45%; text-align: center;">
              <div style="border-top: 1px solid black; margin-top: 50px;"></div>
              <p style="margin: 5px 0;">Estevão Henrique Holz</p>
              <p style="margin: 5px 0; font-style: italic;">CPF: 979.001.257-87</p>
            </div>
          </div>
          
          <div style="margin-top: 30px;">
            <p><strong>Responsável pela conferência:</strong> ${formData.value.responsavelConferencia}</p>
          </div>
        </div>
      `;
      
      return html;
    };
    
    // Função auxiliar para gerar linhas de checklist
    const gerarLinhasChecklist = (categoria, items) => {
      let html = `
        <tr style="background-color: #e0e0e0;">
          <td colspan="4" style="padding: 8px; border: 1px solid #ccc; font-weight: bold;">${categoria}</td>
        </tr>
      `;
      
      items.forEach(item => {
        html += `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${item.tarefa}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
              ${item.preparacao ? '✓' : ''}
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
              ${item.conferencia ? '✓' : ''}
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
              ${item.coordenador ? '✓' : ''}
            </td>
          </tr>
        `;
      });
      
      return html;
    };
    
    // Salvar os dados no localStorage
    const salvarLocalStorage = () => {
      const dadosSalvos = {
        formData: formData.value,
        checklistGeral: checklistGeral.value,
        checklistCredenciamento: checklistCredenciamento.value,
        checklistHabilitacao: checklistHabilitacao.value,
        checklistPropostaTecnica: checklistPropostaTecnica.value,
        checklistPropostaPrecos: checklistPropostaPrecos.value
      };
      
      localStorage.setItem('relatorioTermoAutorizacao', JSON.stringify(dadosSalvos));
    };
    
    // Carregar dados do localStorage
    const carregarLocalStorage = () => {
      const dadosSalvos = localStorage.getItem('relatorioTermoAutorizacao');
      if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos);
        formData.value = dados.formData;
        checklistGeral.value = dados.checklistGeral;
        checklistCredenciamento.value = dados.checklistCredenciamento;
        checklistHabilitacao.value = dados.checklistHabilitacao;
        checklistPropostaTecnica.value = dados.checklistPropostaTecnica;
        checklistPropostaPrecos.value = dados.checklistPropostaPrecos;
      }
    };
    
    // Limpar formulário
    const limparForm = () => {
      if (confirm('Tem certeza que deseja limpar todos os dados do formulário?')) {
        formData.value = {
          localData: '',
          isCliente: false,
          isProspect: false,
          objeto: '',
          modalidadeTipo: '',
          dataHoraLicitacao: '',
          prazoVigencia: '',
          esclarecimentos: '',
          visitaPreLicitacao: '',
          docsHabilitacao: '',
          julgamentoLances: '',
          bancoDados: '',
          valorEstimadoEdital: '',
          valorProposta: '',
          percentualAtendimento: '',
          itensImpugnaveis: '',
          valorConcorrente: '',
          nomeConcorrente: '',
          distanciaFiliais: '',
          infoAdicionais: '',
          periodicidadeVisitas: '',
          pedeDemonstracao: '',
          multas: '',
          prazoImplantacao: '',
          sistemasImplantados: '',
          cotacaoObrigatoria: '',
          prazoRecurso: '',
          condicaoReajuste: '',
          impedeDocumental: '',
          impedeTecnica: '',
          participar: null,
          motivoNaoParticipar: '',
          responsavelConferencia: ''
        };
        
        // Limpar checklists
        limparChecklist(checklistGeral.value);
        limparChecklist(checklistCredenciamento.value);
        limparChecklist(checklistHabilitacao.value);
        limparChecklist(checklistPropostaTecnica.value);
        limparChecklist(checklistPropostaPrecos.value);
        
        // Limpar localStorage
        localStorage.removeItem('relatorioTermoAutorizacao');
      }
    };
    
    // Função auxiliar para limpar checklists
    const limparChecklist = (checklist) => {
      checklist.forEach(item => {
        item.preparacao = false;
        item.conferencia = false;
        item.coordenador = false;
      });
    };
    
    // Salvar dados no banco
    const salvar = async () => {
      try {
        // Aqui você conectaria com o Supabase ou qualquer outra API
        // Por enquanto vamos salvar no localStorage
        salvarLocalStorage();
        alert('Dados salvos com sucesso!');
      } catch (error) {
        console.error('Erro ao salvar dados:', error);
        alert('Erro ao salvar dados. Verifique o console para mais detalhes.');
      }
    };
    
    // Auto-salvar a cada 30 segundos
    let autoSaveInterval;
    
    // Assistir mudanças no formulário para salvar no localStorage
    watch(
      [
        formData, 
        checklistGeral, 
        checklistCredenciamento,
        checklistHabilitacao,
        checklistPropostaTecnica,
        checklistPropostaPrecos
      ],
      () => {
        // Salvar automaticamente ao modificar o form
        salvarLocalStorage();
      },
      { deep: true }
    );
    
    // Inicialização
    onMounted(() => {
      // Carregar dados salvos, se existirem
      carregarLocalStorage();
      
      // Configurar auto-save
      autoSaveInterval = setInterval(salvarLocalStorage, 30000);
      
      // Definir local e data padrão se estiver vazio
      if (!formData.value.localData) {
        const hoje = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        formData.value.localData = `Domingos Martins-ES, ${hoje.getDate()} de ${hoje.toLocaleDateString('pt-BR', { month: 'long' })} de ${hoje.getFullYear()}`;
      }
    });
    
    onUnmounted(() => {
      // Limpar intervalo ao desmontar o componente
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    });
    
    return {
      formData,
      checklistGeral,
      checklistCredenciamento,
      checklistHabilitacao,
      checklistPropostaTecnica,
      checklistPropostaPrecos,
      voltar,
      exportarPDF,
      exportarWord,
      salvar,
      limparForm
    };
  }
};
</script>

<style scoped>
.relatorio-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f9f9f9;
}

.relatorio-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
  background-color: #f9f9f9;
}

.formulario-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.secao {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.secao:last-child {
  border-bottom: none;
}

.cabecalho {
  text-align: center;
  margin-bottom: 40px;
}

.local-data {
  text-align: right;
  margin-bottom: 20px;
}

.input-transparente {
  border: none;
  border-bottom: 1px dashed #ccc;
  width: 100%;
  padding: 5px;
  text-align: right;
  font-style: italic;
}

.input-transparente:focus {
  outline: none;
  border-bottom-color: #3498db;
}

.titulo-relatorio {
  font-size: 24px;
  font-weight: bold;
  margin: 20px 0;
  color: #193155;
}

.tipo-cliente {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.checkbox-container, .radio-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-text, .radio-text {
  margin-left: 5px;
}

.ml-4 {
  margin-left: 20px;
}

.info-gerais {
  margin-top: 30px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
}

textarea.form-control {
  resize: vertical;
  min-height: 60px;
}

.sub-campos {
  margin-top: 10px;
  padding-left: 20px;
  border-left: 3px solid #eee;
}

.participacao {
  margin-top: 30px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.opcoes-participacao {
  display: flex;
  margin: 15px 0;
}

.assinaturas {
  margin-top: 50px;
}

.assinaturas h3 {
  margin-bottom: 20px;
  color: #193155;
  font-size: 18px;
}

.assinatura-campo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.linha-assinatura {
  width: 100%;
  height: 1px;
  background-color: #000;
  margin-bottom: 10px;
}

.nome-assinatura {
  margin: 0;
  font-weight: bold;
}

.cargo-assinatura {
  margin: 5px 0 0;
  font-style: italic;
  color: #666;
}

.check-list {
  margin-top: 40px;
}

.check-list h2 {
  color: #193155;
  margin-bottom: 20px;
}

.check-table {
  width: 100%;
  border-collapse: collapse;
}

.check-table th, .check-table td {
  border: 1px solid #ddd;
  padding: 10px;
}

.check-table th {
  background-color: #f5f5f5;
  text-align: left;
}

.check-cell {
  text-align: center;
}

.categoria {
  background-color: #e0e0e0;
  font-weight: bold;
}

.responsavel-conferencia {
  margin-top: 30px;
}

.acoes-form {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 40px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background-color: #193155;
  color: white;
}

.btn-primary:hover {
  background-color: #12233e;
}

.btn-secondary {
  background-color: #3498db;
  color: white;
}

.btn-secondary:hover {
  background-color: #2980b9;
}

.btn-warning {
  background-color: #f39c12;
  color: white;
}

.btn-warning:hover {
  background-color: #d35400;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

@media print {
  .acoes-form {
    display: none;
  }
  
  body {
    font-size: 12pt;
  }
  
  .formulario-container {
    box-shadow: none;
    border: none;
  }
}
</style>