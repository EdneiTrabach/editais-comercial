<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <!-- Indicador de carregamento -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div v-if="showTimeoutMessage" class="timeout-message">
        Carregamento demorado, por favor aguarde...
      </div>
    </div>

    <!-- Indicador de reconexão -->
    <div v-if="isReconnecting" class="reconnecting-indicator">
      Reconectando...
    </div>

    <!-- Conteúdo principal -->
    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <!-- Loading overlay -->
      <div class="header">
        <h1>Novo Processo Licitatório</h1>
        <!-- Adicione após o header no template -->
        <button class="btn-import" @click="showImportModal = true">
          Importar Publicação
        </button>
      </div>


      <div class="form-container">
        <form @submit.prevent="handleSubmit" class="form-grid">
          <div class="form-group">
            <RequiredLabel text="Número do Processo" :isRequired="true" />
            <div class="processo-input">
              <input v-model="formData.numero" type="text" required placeholder="Número" />
              <span class="separator">/</span>
              <input v-model="formData.ano" type="number" required :min="currentYear - 2" :max="currentYear + 2"
                placeholder="Ano" />
            </div>
          </div>

          <div class="form-group">
            <RequiredLabel text="Data do Pregão" :isRequired="true" />
            <input v-model="formData.data_pregao" type="date" required :class="{ 'error': dateError }"
              @change="validateDate" />
            <small v-if="dateError" class="error-message">{{ dateError }}</small>
          </div>

          <div class="form-group">
            <RequiredLabel text="Hora do Pregão" :isRequired="true" />
            <input v-model="formData.hora_pregao" type="time" required min="08:00" max="18:00" @change="validateTime" />
            <small v-if="timeError" class="error-message">{{ timeError }}</small>
          </div>

          <div class="form-group">
            <RequiredLabel text="Estado" :isRequired="true" />
            <select v-model="formData.estado" required>
              <option value="">Selecione o estado...</option>
              <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
                {{ estado.nome }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <RequiredLabel text="Órgão" :isRequired="true" />
            <input v-model="formData.orgao" type="text" required placeholder="Nome do órgão" class="input-orgao" />
          </div>

          <div class="form-group">
            <RequiredLabel text="Modalidade" :isRequired="true" />
            <select v-model="formData.modalidade" required @change="handleModalidadeChange">
              <option value="">Selecione...</option>
              <option value="pregao_eletronico">Pregão Eletrônico</option>
              <option value="pregao_presencial">Pregão Presencial</option>
              <option value="credenciamento">Credenciamento</option>
              <option value="concorrencia">Concorrência</option>
              <option value="concurso">Concurso</option>
              <option value="leilao">Leilão</option>
              <option value="dialogo_competitivo">Diálogo Competitivo</option>
              <option value="tomada_precos">Tomada de Preços</option>
              <option value="chamamento_publico">Chamamento Público</option>
              <option value="rdc">RDC</option>
              <option value="rdc_eletronico">RDC Eletrônico</option>
              <option value="srp">SRP</option>
              <option value="srp_eletronico">SRP Eletrônico</option>
              <option value="srp_internacional">SRP Internacional</option>
            </select>
          </div>

          <!-- Campo de Plataforma -->
          <div class="form-group" v-if="showPlataformaField">
            <RequiredLabel text="Plataforma" :isRequired="true" />
            <div class="plataforma-container">
              <select v-model="formData.site_pregao" required>
                <option value="">Selecione a plataforma...</option>
                <option v-for="plataforma in plataformas" :key="plataforma.id" :value="plataforma.url">
                  {{ plataforma.nome }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-group full-width">
            <RequiredLabel text="Objeto Resumido (máx. 700 caracteres)" :isRequired="false" />
            <div class="objeto-container">
              <input v-model="formData.objeto_resumido" type="string" maxlength="700"
                placeholder="Breve descrição do objeto" class="input-descricao" />
              <small>{{ formData.objeto_resumido?.length || 0 }}/700</small>

              <div class="form-group">
                <label>Sistemas Incluídos</label>
                <div class="sistemas-grid">
                  <div v-for="sistema in sistemasAtivos" :key="sistema.id" class="sistema-chip"
                    :class="{ selected: sistemasSelecionados.includes(sistema.id) }" @click="toggleSistema(sistema.id)">
                    {{ sistema.nome }}
                    <span v-if="sistemasSelecionados.includes(sistema.id)" class="check-icon">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group full-width">
            <RequiredLabel text="Objeto Completo" :isRequired="true" />
            <textarea v-model="formData.objeto_completo" rows="4" required
              placeholder="Descrição completa do objeto conforme Art. 40"></textarea>
          </div>

          <!-- Adicione após o campo de objeto_completo -->
          <div class="form-group full-width">
            <RequiredLabel text="Cálculo de Distância" :isRequired="false" />
            <div class="distancia-container">
              <div class="pontos-container">
                <!-- ORDEM INVERTIDA: Primeiro a Cidade do Órgão -->
                <div class="ponto-destino">
                  <label>Cidade do Órgão</label>
                  <div class="cidade-input">
                    <select v-model="filtroEstadoReferencia" @change="carregarMunicipios" class="estado-select">
                      <option value="">Estado...</option>
                      <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
                        {{ estado.nome }}
                      </option>
                    </select>
                    <select v-model="cidadeOrgao" :disabled="!estadoDestino || !municipiosCarregados"
                      class="cidade-select">
                      <option value="">Cidade...</option>
                      <option v-for="municipio in municipios" :key="municipio.id" :value="municipio">
                        {{ municipio.nome }}
                      </option>
                    </select>
                  </div>
                </div>

                <!-- E depois o Ponto de Referência -->
                <div class="ponto-origem">
                  <label>Ponto Referência</label>
                  <div class="referencia-container">
                    <select v-model="filtroEstadoReferencia">
                      <option value="">Todos os Estados</option>
                      <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
                        {{ estado.nome }}
                      </option>
                    </select>
                    <select v-model="pontoReferencia">
                      <option value="">Selecione o ponto de referência...</option>
                      <option v-for="ponto in pontosFiltrados" :key="ponto.cidade" :value="ponto">
                        {{ ponto.cidade }}/{{ ponto.uf }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Botões e Resultado -->
              <div class="distancia-actions">
                <button @click="calcularDistancia" class="btn-calcular"
                  :disabled="calculandoDistancia || !pontoReferencia || !cidadeOrgao || !formData.estado">
                  {{ calculandoDistancia ? 'Calculando...' : 'Calcular Distância' }}
                </button>

                <div v-if="distanciaCalculada" class="distancia-result">
                  <span class="distance-value">{{ distanciaCalculada }}</span>
                  <button @click="adicionarDistanciaLista" class="btn-add-distancia">
                    <span>Adicionar à Lista</span>
                    <span class="icon">+</span>
                  </button>
                </div>
              </div>

              <!-- Adicione após o div.distancia-actions -->
              <!-- Exibição aprimorada das distâncias calculadas -->
              <div v-if="distanciasSalvas.length > 0" class="distancias-lista">
                <h4>Distâncias</h4>
                <div class="distancia-items">
                  <div v-for="(dist, index) in distanciasSalvas" :key="index" class="distancia-item">
                    <div class="distancia-info">
                      <!-- Verifica se é entrada manual e exibe apenas o texto digitado -->
                      <template v-if="dist.isManual">
                        <span class="distancia-valor">{{ dist.distancia_km }}</span>
                      </template>
                      <!-- Para entradas calculadas, mantém a formatação original -->
                      <template v-else>
                        <span class="distancia-valor">{{ dist.distancia_km }} km</span>
                        <span class="distancia-rota">de {{ dist.cidade_origem }}/{{ dist.uf_origem }} para {{
                          dist.ponto_referencia_cidade }}/{{ dist.ponto_referencia_uf }}</span>
                      </template>
                    </div>
                    <button @click="removerDaLista(index)" class="btn-remover">×</button>
                  </div>
                </div>
              </div>

              <!-- Modo manual -->
              <div class="distancia-manual-input">
                <label class="label-distancia">Distância:</label>
                <input type="text" v-model="distanciaManualValue" class="input-distancia-manual"
                  placeholder="Digite a distância (ex: 50 km, aprox. 2h, etc.)" />

                <button @click="salvarDistanciaManual" class="btn-add-distancia">
                  <span>Adicionar à Lista</span>
                  <span class="icon">+</span>
                </button>
              </div>

              <!-- Lista de Distâncias Salvas -->
            </div>
          </div>

          <!-- Campo de Representante -->
          <div class="form-group">
            <RequiredLabel text="Representante" :isRequired="true" />
            <div class="representante-container">
              <select v-model="formData.representante" required>
                <option value="">Selecione o representante...</option>
                <option v-for="rep in representantes" :key="rep.id" :value="rep.id">
                  {{ rep.nome }}
                </option>
              </select>
            </div>
          </div>

          <!-- Adicione este campo após o campo de representante -->
          <div class="form-group">
            <RequiredLabel text="Valor Estimado" :isRequired="false" />
            <div class="valor-container">
              <input v-model="formData.valor_estimado" @keypress="validarInput($event, formData.valor_estimado)"
                @input="sanitizarInput" @blur="formData.valor_estimado = formatarValorEstimado(formData.valor_estimado)"
                class="input-valor-com-prefixo form-control" type="text" />
            </div>
          </div>

          <!-- Adicionar esta seção após o campo de valor estimado, caso deseje visualizar a publicação -->
          <div v-if="formData.publicacao_original" class="form-group full-width">
            <RequiredLabel text="Publicação Original" :isRequired="false" />
            <div class="publicacao-container">
              <textarea v-model="formData.publicacao_original" rows="6" readonly class="publicacao-text"></textarea>
            </div>
          </div>

          <div class="form-group">
            <RequiredLabel text="Observações" :isRequired="false" />
            <input v-model="formData.campo_adicional1" type="text" placeholder="Obesevarções adicionais"
              class="input-orgao" />
          </div>

          <div class="form-group">
            <RequiredLabel text="Campo Adicional 2" :isRequired="false" />
            <input v-model="formData.campo_adicional2" type="text" placeholder="Campo opcional 2" />
          </div>

          <!-- Substitua o campo de responsável existente por este -->
          <div class="form-group">
  <RequiredLabel text="Responsável" :isRequired="false" />
  <select v-model="formData.responsavel_id" class="responsavel-select">
    <option value="">Sem responsável definido</option>
    <option v-for="resp in responsaveis_usuario" :key="resp.id" :value="resp.id">
      {{ resp.nome }} ({{ resp.email }}){{ resp.departamento ? ` - ${resp.departamento}` : '' }}
    </option>
  </select>
</div>

          <div class="form-actions">
            <button type="button" class="btn-cancelar" @click="handleCancel">
              Cancelar
            </button>
            <button v-if="formData.extraction_id" type="button" class="btn-correcoes" @click="salvarCorrecoes">
              Salvar Correções
            </button>
            <button type="submit" class="btn-salvar" :disabled="loading">
              {{ loading ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Adicione logo após o fechamento da div.layout -->
  <div class="toast-container">
    <div v-if="toast.show" :class="['toast', `toast-${toast.type}`]">
      {{ toast.message }}
    </div>
  </div>

  <!-- Modal para adicionar nova plataforma -->
  <div v-if="showPlataformaModal" class="modal-cfg-usuarios">
    <div class="modal-content-cfg-usuarios">
      <h3 class="modal-title-cfg-usuarios">Nova Plataforma</h3>
      <form @submit.prevent="handleAddPlataforma" class="form-cfg-usuarios">
        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Nome da Plataforma</label>
          <input v-model="novaPlatforma.nome" required class="input-cfg-usuarios">
        </div>

        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">URL</label>
          <input v-model="novaPlatforma.url" type="url" required class="input-cfg-usuarios">
        </div>

        <div v-if="formData.estado" class="form-group-cfg-usuarios validation-info">
          <div class="info-message">
            <strong>Nota:</strong> Certifique-se que esta plataforma é utilizada no estado
            selecionado ({{ formData.estado }}). Plataformas não comuns podem causar problemas na validação.
          </div>
        </div>

        <div class="modal-actions-cfg-usuarios">
          <button type="button" class="btn-cancel-cfg-usuarios" @click="showPlataformaModal = false">
            Cancelar
          </button>
          <button type="submit" class="btn-confirm-cfg-usuarios">
            Salvar
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal para adicionar novo representante -->
  <div v-if="showRepresentanteModal" class="modal-cfg-usuarios">
    <div class="modal-content-cfg-usuarios">
      <h3 class="modal-title-cfg-usuarios">Novo Representante</h3>
      <form @submit.prevent="handleAddRepresentante" class="form-cfg-usuarios">
        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Nome</label>
          <input v-model="novoRepresentante.nome" required class="input-cfg-usuarios">
        </div>

        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Documento (CPF/CNPJ)</label>
          <input v-model="novoRepresentante.documento" class="input-cfg-usuarios">
        </div>

        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Email</label>
          <input v-model="novoRepresentante.email" type="email" class="input-cfg-usuarios">
        </div>

        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Telefone</label>
          <input v-model="novoRepresentante.telefone" class="input-cfg-usuarios">
        </div>

        <div class="modal-actions-cfg-usuarios">
          <button type="button" class="btn-cancel-cfg-usuarios" @click="showRepresentanteModal = false">
            Cancelar
          </button>
          <button type="submit" class="btn-confirm-cfg-usuarios">
            Salvar
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal de importação -->
  <div v-if="showImportModal" class="modal-cfg-usuarios">
    <div class="modal-content-cfg-usuarios">
      <h3 class="modal-title-cfg-usuarios">Importar Publicação</h3>
      <div class="form-group-cfg-usuarios">
        <label class="label-cfg-usuarios">Cole aqui o texto da publicação:</label>
        <textarea v-model="publicacaoText" rows="10" placeholder="Cole aqui o texto completo da publicação..."
          class="input-cfg-usuarios textarea-cfg-usuarios"></textarea>
      </div>

      <div class="modal-actions-cfg-usuarios">
        <button class="btn-cancel-cfg-usuarios" @click="closeImportModal">
          Cancelar
        </button>
        <button class="btn-confirm-cfg-usuarios" @click="handleProcessPublication">
          Processar Publicação
        </button>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <div v-if="toast.show" :class="['toast-cfg-usuarios', `toast-${toast.type}`]">
    {{ toast.message }}
  </div>
</template>

<script src="../views/EditaisView.js"></script>
<style src="../assets/styles/EditaisView.css"></style>
