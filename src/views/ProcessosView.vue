<template>
  <div class="layout">
    <TheSidebar @sidebarToggle="handleSidebarToggle" />

    <div class="main-content" :class="{ 'expanded': !isSidebarExpanded }">
      <div class="header-processos">
        <h1>Processos Licitatórios</h1>

        <div class="actions">
          <button class="btn-action-actions" @click="undoAction" :disabled="!undoHistory || undoHistory.length === 0"
            title="Desfazer (Ctrl+Z)">
            <img src="/icons/undo.svg" alt="Desfazer" class="icon" />
          </button>
          <button class="btn-action-actions" @click="redoAction" :disabled="!redoHistory || redoHistory.length === 0"
            title="Refazer (Ctrl+Y)">
            <img src="/icons/redo.svg" alt="Refazer" class="icon" />
          </button>
          
          <!-- Botão de Tour -->
          <button class="btn-tour" @click="startTour" title="Iniciar Tour">
            <img src="/icons/question-circle.svg" alt="Tour" class="icon" />
          </button>

          <!-- Botão para resetar configurações da tabela -->
          <!-- <button class="btn-reset-table" title="Resetar configurações da tabela" @click="resetarConfiguracaoTabela">
            <img src="/icons/refresh.svg" alt="Resetar tabela" class="icon-reset" /> Resetar tabela
          </button> -->
          
          <!-- Botão de filtro avançado -->
          <button 
            class="btn-filter" 
            :class="{ 'active': showAdvancedFilter }" 
            @click="toggleAdvancedFilter" 
            title="Filtro Avançado"
          >
          <img src="/public/icons/filter-2.svg" alt="filtros avançados" class="icon-filter" />
            
          Filtros
            <span v-if="activeAdvancedFiltersCount > 0" class="filter-badge">
              {{ activeAdvancedFiltersCount }}
            </span>
          </button>

          <button class="btn-export" @click="exportToExcel">
            <img src="/icons/excel.svg" alt="Exportar" class="icon" />
            Exportar
          </button>
          <button class="btn-add" @click="handleNewProcess">
            <img src="/icons/adicao.svg" alt="Adicionar" class="icon icon-add" />
            Novo Processo
          </button>
        </div>
      </div>
      
      <!-- Área com scroll -->
      <div class="scrollable-content">
        <!-- Container do Filtro Avançado -->
        <div 
          class="advanced-filter-container-wrapper"
          :class="{ 'is-visible': showAdvancedFilter }"
          v-show="showAdvancedFilter"
        >
          <AdvancedFilterComponent
            :status-options="statusOptions"
            :modalidade-options="opcoesModalidade"
            :responsaveis="responsaveisProcessos"
            :estados="estados"
            :initial-filters="advancedFilters"
            @close="showAdvancedFilter = false"
            @update-filters="updateAdvancedFilters"
            @apply-filters="applyAdvancedFilters"
            @clear-filters="clearAdvancedFilters"
          />
        </div>

        <!-- Active Filters -->
        <div class="filtros-ativos" v-if="temFiltrosAtivos || activeAdvancedFiltersCount > 0">
          <span>Filtros ativos:</span>
          <button @click="limparTodosFiltros" class="btn-limpar-filtros">
            Limpar todos os filtros
          </button>
        </div>

        <!-- Data Table -->
        <div class="table-container">
          <table class="excel-table resizable">
            <thead>
              <tr>
                <th class="row-number-cell"></th>
                <!-- Colunas ordenáveis -->
                <th v-for="(coluna, index) in ordenarColunas" :key="coluna.campo" :data-field="coluna.campo"
                  draggable="true" @dragstart="startColumnDrag($event, index)" @dragover="allowColumnDrop($event)"
                  @drop="handleColumnDrop($event, index)" :style="{ width: colunasWidth[coluna.campo] }"
                  :class="{ 'resizable-column': true }">
                  <div class="th-content">
                    {{ coluna.titulo }}
                    <!-- <div class="column-drag-handle" title="Arraste para reordenar">⋮⋮</div> -->
                    <!-- Sort buttons for date column -->
                    <div v-if="coluna.campo === 'data_pregao'" class="sort-buttons">
                      <button class="btn-sort"
                        :class="{ active: sortConfig.field === 'data_pregao' && sortConfig.direction === 'asc' }"
                        @click="handleSort('data_pregao', 'asc')">
                        ▲
                      </button>
                      <button class="btn-sort"
                        :class="{ active: sortConfig.field === 'data_pregao' && sortConfig.direction === 'desc' }"
                        @click="handleSort('data_pregao', 'desc')">
                        ▼
                      </button>
                    </div>
                  </div>
                  <div class="column-resize-handle" @mousedown.stop="startColumnResize($event, coluna.campo)"></div>
                </th>
                <!-- Coluna de ações separada -->
                <th class="actions-column">Ações</th>
                <!-- <td class="resize-handle-cell">
                  <div class="row-resize-handle" @mousedown.stop="startRowResize($event, processo.id)"></div>
                </td> -->
              </tr>
            </thead>
            <tbody>
              <tr v-for="(processo, index) in processosFiltrados" :key="processo.id" class="resizable-row"
                :class="{ 'selected-row': selectedRow === processo.id }" :data-status="processo.status"
                @click="selectRow(processo.id)" :style="{ height: rowsHeight[processo.id] }">
                <td class="row-number-cell">{{ index + 1 }}</td>

                <!-- Células de dados ordenáveis -->
                <td v-for="coluna in ordenarColunas" :key="coluna.campo" :data-field="coluna.campo" :data-id="processo.id"
                  :class="{ 'selecionada': selectedRow === processo.id }"
                  @dblclick="coluna.campo === 'codigo_analise' ? handleAnaliseClick(processo) : 
                    coluna.campo === 'responsavel_id' ? handleDblClickResponsavel(coluna.campo, processo, $event) :
                    coluna.campo === 'representante_id' ? handleDblClickRepresentante(coluna.campo, processo, $event) : 
                    coluna.campo === 'empresa_id' ? handleDblClickEmpresa(coluna.campo, processo, $event) :
                    coluna.campo === 'empresa_vencedora' ? openEmpresaVencedoraDialog(processo) :
                    coluna.campo === 'distancia_km' || coluna.tipoExibicao === 'distancia' ? abrirDialogDistancia(processo, $event) :
                    coluna.campo === 'sistemas_implantacao' ? showSistemasImplantacaoDialog(processo, $event) :
                    handleDblClick(coluna.campo, processo, $event)">
                  
                  <!-- Template específico para empresa vencedora -->
                  <template v-if="coluna.campo === 'empresa_vencedora'">
                    <div class="empresa-vencedora-container" 
                         @click="console.log('Click em empresa vencedora', processo.id); openEmpresaVencedoraDialog(processo)" 
                         @dblclick.stop="console.log('Double click em empresa vencedora', processo.id); openEmpresaVencedoraDialog(processo)">
                      <template v-if="processo.empresa_vencedora">
                        <div class="empresa-vencedora-info" v-if="isJsonObject(processo.empresa_vencedora)">
                          <div class="empresa-nome">{{ getEmpresaVencedoraNome(processo.empresa_vencedora) }}</div>
                          <div class="empresa-contrato" v-if="getEmpresaVencedoraContrato(processo.empresa_vencedora)">
                            Contrato: {{ getEmpresaVencedoraContrato(processo.empresa_vencedora) }}
                          </div>
                        </div>
                        <div class="empresa-vencedora-info" v-else>
                          {{ processo.empresa_vencedora }}
                        </div>
                      </template>
                      <div v-else class="sem-empresa-vencedora">
                      </div>
                    </div>
                  </template>
                  
                  <!-- Template específico para sistemas a implantar -->
                  <template v-else-if="coluna.campo === 'sistemas_implantacao'">
                    <div class="sistemas-implantacao-container" @click="openSistemasImplantacaoDialog(processo, $event)">
                      <div v-if="getSistemasImplantacaoCount(processo) > 0" class="sistemas-implantacao-info">
                        <div class="sistemas-implantacao-badges">
                          <span>{{ getSistemasImplantacaoCount(processo) }} sistemas</span>
                          <img src="/icons/pending-icon.svg" alt="A implantar" class="icon-sistemas-implantacao" />
                        </div>
                      </div>
                      <!-- <div v-else class="sem-sistemas-implantacao">
                        <span class="icon-add">+</span> Definir sistemas a implantar
                      </div> -->
                    </div>
                  </template>
                  
                  <!-- Editing Mode -->
                  <template v-else-if="editingCell.id === processo.id && editingCell.field === coluna.campo">
                    <!-- Analysis Code field -->
                    <!-- <input v-if="coluna.campo === 'codigo_analise'" type="text" v-model="editingCell.value"
                      @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()"
                      placeholder="Digite o código"> -->

                    <!-- Date field -->
                    <input v-if="coluna.campo === 'data_pregao'" ref="editInput" type="date" v-model="editingCell.value"
                      :min="new Date().toISOString().split('T')[0]" @blur="handleUpdate(processo)"
                      @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()">

                    <!-- Time field -->
                    <input v-else-if="coluna.campo === 'hora_pregao'" type="time" v-model="editingCell.value" min="08:00"
                      max="18:00" @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)"
                      @keyup.esc="cancelEdit()">

                    <!-- State field -->
                    <select v-else-if="coluna.campo === 'estado'" v-model="editingCell.value"
                      @change="handleUpdate(processo)" @blur="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                      <option value="">Selecione o estado...</option>
                      <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
                        {{ estado.nome }}
                      </option>
                    </select>

                    <!-- Impugnações field -->
                    <textarea v-else-if="coluna.campo === 'impugnacoes'" v-model="editingCell.value"
                      @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()"
                      rows="3" placeholder="Digite as impugnações..."></textarea>

                    <!-- Representative field -->
                    <select v-else-if="coluna.campo === 'representante'" v-model="editingCell.value"
                      @change="handleUpdate(processo)" @blur="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                      <option value="">Selecione o representante...</option>
                      <option v-for="rep in representantes" :key="rep.id" :value="rep.id">
                        {{ rep.nome }}
                      </option>
                    </select>

                    <!-- Full Object field -->
                    <textarea 
                      v-else-if="coluna.campo === 'objeto_completo'" 
                      v-model="editingCell.value"
                      rows="2"
                      @blur="handleUpdate(processo)" 
                      @keyup.enter="handleUpdate(processo)" 
                      @keyup.esc="cancelEdit()"
                      class="auto-resize-textarea">
                    </textarea>

                    <!-- Modality field -->
                    <select v-else-if="coluna.campo === 'modalidade'" v-model="editingCell.value"
                      @blur="handleUpdate(processo)" @change="handleUpdate(processo)" @keyup.esc="cancelEdit()">
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

                    <!-- Status field -->
                    <select v-else-if="coluna.campo === 'status'" 
                      v-model="editingCell.value"
                      @change="handleUpdate(processo)" 
                      @blur="handleUpdate(processo)" 
                      @keyup.esc="cancelEdit()"
                      class="status-select"
                      :class="getStatusClass(processo)"
                      :title="isRecurringStatus(processo) ? `Notificações automáticas ativadas. Próxima notificação: ${nextNotificationDateMap[processo.id] || 'calculando...'}` : ''">
                      <option value="">Selecione um status...</option>
                      <option value="adiado">Adiado</option>
                      <option value="cancelado">Cancelado</option>
                      <option value="demonstracao">Demonstração</option>
                      <option value="em_analise">Em Análise</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="ganhamos">Ganhamos</option>
                      <option value="nao_participar">Decidido Não Participar</option>
                      <option value="perdemos">Perdemos</option>
                      <option value="revogado">Revogado</option>
                      <option value="suspenso">Suspenso</option>
                      <option value="vamos_participar">Vamos Participar</option>
                    </select>

                    <!-- Systems field -->
                    <template v-else-if="coluna.campo === 'sistemas_ativos'">
                      <div class="sistemas-dropdown-container">
                        <div class="sistemas-selected">
                          <div v-for="id in editingCell.value" :key="id" class="sistema-chip">
                            {{ getSistemaNome(id) }}
                            <span @click.stop="removerSistema(id)" class="sistema-remove">×</span>
                          </div>
                        </div>
                      </div>
                    </template>

                    <!-- Additional field (Observações) -->
                    <textarea v-else-if="coluna.campo === 'campo_adicional1'" v-model="editingCell.value" rows="3"
                      class="observacoes-edit" @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)"
                      @keyup.esc="cancelEdit()"></textarea>

                    <!-- Default input for codigo_analise -->
                    <input v-else-if="coluna.campo === 'codigo_analise'" type="text" v-model="editingCell.value"
                      @blur="handleUpdate(processo)" @keyup.enter="handleUpdate(processo)" @keyup.esc="cancelEdit()"
                      placeholder="Digite o código">

                    <!-- Portal/Plataforma field -->
                    <select v-else-if="coluna.campo === 'site_pregao'" v-model="editingCell.value"
                      @blur="handleUpdate(processo)" @change="handleUpdate(processo)" @keyup.esc="cancelEdit()">
                      <option value="">Selecione uma plataforma...</option>
                      <option value="https://semurl.com.br">A CONFIRMAR!</option>
                      <option value="https://minhaconta.ammlicita.org.br/oauth2/in/">AMM LICITA</option>
                      <option value="https://www.bec.sp.gov.br/bec_pregao_UI/OC/pesquisa_publica.aspx?chave=">BEC</option>
                      <option value="https://auth.novobbmnet.com.br/realms/BBM/protocol/openid-connect/auth?client_id=cadastro-participantes-admin-site&redirect_uri=https%3A%2F%2Fsistema.novobbmnet.com.br%2F&state=20beb4b7-5987-4a16-9906-1c03ecfe53b7&response_mode=fragment&response_type=code&scope=openid&nonce=6641a057-d2de-4064-ad17-6a1461d42a81&code_challenge=HjW7w3_2OWK-sR0nodbHpIFVW_mqs7HAfSIqMygjiTE&code_challenge_method=S256">BBMNET</option>
                      <option value="https://bllcompras.com/Home/Login">BLL</option>
                      <option value="https://bnccompras.com/Home/Login">BNC</option>
                      <option value="https://www.licitacoes.caixa.gov.br/SitePages/pagina_inicial.aspx">CAIXA</option>
                      <option value="https://app.comprasbr.com.br/auto-cadastro/#/validado/login/externo?uri=https:%2F%2Fapp.comprasbr.com.br%2Flicitacao&produto=licitacao">COMPRASBR</option>
                      <option value="https://www.comprasnet.gov.br/seguro/loginPortal.asp">COMPRASNET</option>
                      <option value="https://elicitacao.com.br/">eLICITAÇÃO</option>
                      <option value="https://www.licitacoes-e.com.br/aop/index.jsp">LICITAÇÕES-E</option>
                      <option value="https://portal.licitanet.com.br/login">LICITANET</option>
                      <option value="https://minhaconta.licitardigital.com.br/oauth2/in/">LICITAR DIGITAL</option>
                      <option value="https://operacao.portaldecompraspublicas.com.br/18/loginext/">PORTAL DE COMPRAS PUBLICAS</option>
                    </select>

                    <!-- Input genérico para campos sem tratamento específico (como Órgão) -->
                    <textarea 
                      v-else 
                      v-model="editingCell.value" 
                      rows="2"
                      @blur="handleUpdate(processo)"
                      @keyup.enter="handleUpdate(processo)"
                      @keyup.esc="cancelEdit()"
                      class="auto-resize-textarea"
                    ></textarea>
                      
                  </template>

                  <!-- View Mode -->
                  <template v-else>
                    <!-- Date field -->
                    <span v-if="coluna.campo === 'data_pregao'">
                      {{ formatDate(processo.data_pregao) }}
                    </span>

                    <!-- Time field -->
                    <span v-else-if="coluna.campo === 'hora_pregao'">
                      {{ formatTime(processo.hora_pregao) }}
                    </span>

                    <!-- Valor Estimado field -->
                    <span v-else-if="coluna.campo === 'valor_estimado'" class="valor-monetario">
                      {{ formatarMoeda(processo.valor_estimado) }}
                    </span>

                    <!-- Modality field -->
                    <span v-else-if="coluna.campo === 'modalidade'">
                      <span :title="formatModalidadeCompleta(processo.modalidade)">
                        {{ getModalidadeSigla(processo.modalidade) }}
                      </span>
                    </span>

                    <!-- Object fields -->
                    <span v-else-if="coluna.campo === 'objeto_resumido' || coluna.campo === 'objeto_completo'"
                      class="objeto-cell">
                      {{ processo[coluna.campo] || '-' }}
                    </span>

                    <!-- Representative field -->
                    <span v-else-if="coluna.campo === 'representante'">
                      {{ processo.representantes?.nome || '-' }}
                    </span>

                    <!-- Responsible name field -->
                    <span v-else-if="coluna.campo === 'responsavel_nome'">
                      {{ processo.profiles?.nome || '-' }}
                    </span>

                    <!-- Site field -->
                    <span v-else-if="coluna.campo === 'site_pregao'">
                      <div class="portal-link">
                        <a v-if="processo.site_pregao" :href="processo.site_pregao" target="_blank"
                          rel="noopener noreferrer" class="portal-button">
                          {{ getPlataformaNome(processo.site_pregao) }}
                        </a>
                        <span v-else>-</span>
                      </div>
                    </span>

                    <!-- Company field -->
                    <span v-else-if="coluna.campo === 'empresa_id'">
                      <div class="responsavel-container">
                        <span 
                          class="empresa-display" 
                          :style="getEmpresaCor(processo.empresa_id) ? 
                                 { backgroundColor: getLightColor(getEmpresaCor(processo.empresa_id)),
                                   color: getEmpresaCor(processo.empresa_id) } : {}"
                        >
                          {{ getEmpresaNome(processo.empresa_id) || 'Sem empresa' }}
                        </span>
                      </div>
                    </span>

                    <!-- Distances field -->
                    <span v-else-if="coluna.campo === 'distancias'" @dblclick="abrirDialogDistancia(processo, $event)">
                      <div class="distancia-container">
                        <div v-if="processo._distancias && processo._distancias.length > 0" class="distancia-multiple">
                          <div v-for="(distancia, idx) in processo._distancias" :key="idx" class="distancia-item">
                            <span v-if="distancia.texto_completo">{{ distancia.texto_completo }}</span>
                            <span v-else>
                              {{ distancia.distancia_km }} km 
                              <span v-if="distancia.ponto_referencia_cidade">
                                ({{ distancia.ponto_referencia_cidade }}/{{ distancia.ponto_referencia_uf }})
                              </span>
                            </span>
                          </div>
                        </div>
                        <div v-else-if="processo.distancia_km" class="distancia-preview">
                          {{ formatarDistancia(processo) }}
                        </div>
                        <div v-else class="sem-distancia">
                          <span>Clique para adicionar</span>
                        </div>
                      </div>
                    </span>

                    <!-- Systems field -->
                    <span v-else-if="coluna.campo === 'sistemas_ativos'">
                      <div class="sistemas-chips">
                        <div v-if="processo.sistemas_ativos && processo.sistemas_ativos.length > 0" class="sistemas-lista">
                          {{ getSistemasNomesString(processo.sistemas_ativos) }}
                        </div>
                        <div v-else class="sem-sistemas">-</div>
                      </div>
                    </span>

                    <!-- Distance type display -->
                    <span v-else-if="coluna.tipoExibicao === 'distancia'" @dblclick="abrirDialogDistancia(processo, $event)">
                      <div class="distancia-container">
                        <div v-if="processo._distancias && processo._distancias.length > 0" class="distancia-multiple">
                          <div v-for="(distancia, idx) in processo._distancias" :key="idx" class="distancia-item">
                            <div class="distancia-text">
                              <span v-if="distancia.texto_completo">{{ distancia.texto_completo }}</span>
                              <span v-else>
                                {{ distancia.distancia_km }} km
                                <span v-if="distancia.ponto_referencia_cidade">
                                  ({{ distancia.ponto_referencia_cidade }}/{{ distancia.ponto_referencia_uf }})
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div v-else class="sem-distancia">
                          <span>Clique para adicionar</span>
                        </div>
                      </div>
                    </span>

                    <!-- Representative ID field -->
                    <span v-else-if="coluna.campo === 'representante_id'">
                      <div class="responsavel-container">
                        <span class="responsavel-display">
                          {{ getRepresentanteNome(processo.representante_id) || 'Sem representante' }}
                        </span>
                      </div>
                    </span>

                    <!-- Responsible ID field -->
                    <span v-else-if="coluna.campo === 'responsavel_id'">
                      <div class="responsavel-container">
                        <span class="responsavel-display">
                          {{ getResponsavelProcessoNome(processo.responsavel_id) || 'Sem responsável' }}
                        </span>
                      </div>
                    </span>

                    <!-- Impugnações field -->
                    <template v-else-if="coluna.campo === 'impugnacoes'">
                      <div class="impugnacao-container" @dblclick="showImpugnacaoDialog(processo)">
                        <!-- Mostra dados apenas se houver alguma informação relevante -->
                        <template v-if="hasRelevantImpugnacaoData(processo)">
                          <div class="impugnacao-info">
                            <template v-if="processo.impugnacao_data_limite">
                              <div class="impugnacao-item">
                                <span class="impugnacao-label">Data limite:</span>
                                <span class="impugnacao-value">{{ formatDate(processo.impugnacao_data_limite) }}</span>
                              </div>
                            </template>
                            
                            <template v-if="processo.impugnacao_itens">
                              <div class="impugnacao-item">
                                <span class="impugnacao-label">Itens:</span>
                                <span class="impugnacao-value">{{ processo.impugnacao_itens }}</span>
                              </div>
                            </template>
                            
                            <template v-if="processo.impugnacoes">
                              <div class="impugnacao-item">
                                <span class="impugnacao-label">Observações:</span>
                                <span class="impugnacao-value">{{ processo.impugnacoes }}</span>
                              </div>
                            </template>
                            
                            <template v-if="processo.impugnacao_forma_envio">
                              <div class="impugnacao-item">
                                <span class="impugnacao-label">Forma de envio:</span>
                                <span class="impugnacao-value">{{ processo.impugnacao_forma_envio }}</span>
                              </div>
                            </template>
                            
                            <template v-if="processo.impugnacao_status && processo.impugnacao_status !== 'nao_iniciado'">
                              <div class="impugnacao-item">
                                <span class="impugnacao-label">Status:</span>
                                <span class="impugnacao-value">{{ formatImpugnacaoStatus(processo.impugnacao_status) }}</span>
                              </div>
                            </template>
                          </div>
                          
                          <!-- <div class="impugnacao-action">
                            <button class="btn-edit-small" @click.stop="showImpugnacaoDialog(processo)">
                              Editar
                            </button>
                          </div> -->
                        </template>
                        
                        <!-- Quando não houver dados relevantes, mostra apenas um ícone para adicionar -->
                        <template v-else>
                          <!-- <div class="impugnacao-empty">
                            <button class="btn-add-impugnacao" @click.stop="showImpugnacaoDialog(processo)">
                              <img src="/icons/add-document.svg" alt="Adicionar impugnação" class="icon-small">
                              <span>Adicionar impugnação</span>
                            </button>
                          </div> -->
                        </template>
                      </div>
                    </template>

                    <!-- Default display for other fields -->
                    <template v-else-if="coluna.campo === 'status'">
                      <!-- Mostrar apenas o texto formatado do status em modo de visualização -->
                      <span 
                        class="status-display" 
                        :class="[getStatusClass(processo), `status-${processo.status}`]"
                        @mouseenter="showStatusInfo(processo, $event)" 
                        @mouseleave="hideStatusInfo"
                        :title="isRecurringStatus(processo) ? `Notificações automáticas ativadas. Próxima notificação: ${nextNotificationDateMap[processo.id] || 'calculando...'}` : ''"
                      >
                        {{ formatStatus(selectedStatusMap[processo.id] || processo.status) }}
                      </span>
                    </template>
                    
                    <!-- Default display for other fields -->
                    <span v-else>
                      {{ processo[coluna.campo] || '-' }}
                    </span>
                  </template>
                </td>
                <!-- Célula de ações separada -->
                <td class="actions-column">
                  <AcoesColumn 
                    :processo="processo"
                    @delete="handleDelete"
                    @duplicate="handleDuplicate"
                    @editar-empresa-vencedora="openEmpresaVencedoraDialog"
                  />
                </td>
                <!-- Row resize handle -->
                <div class="row-resize-handle" @mousedown.stop="startRowResize($event, processo.id)"></div>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Year tabs -->
        <div class="anos-tabs">
          <div class="tabs-header">
            <button v-for="ano in anosDisponiveis" :key="ano" :class="['tab-button', { active: anoSelecionado === ano }]"
              @click="selecionarAno(ano)">
              {{ ano }}
            </button>
          </div>
        </div>
      </div>

      <!-- Confirm dialog -->
      <div 
        v-if="confirmDialog.show" 
        class="confirm-dialog" 
        :style="{
          position: 'absolute',
          top: confirmDialog.position.top,
          left: confirmDialog.position.left,
          zIndex: 1000
        }"
      >
        <div class="confirm-content">
          <p>Deseja editar este campo?</p>
          <div class="confirm-actions">
            <button class="btn-confirm" @click="handleConfirmEdit">Confirmar</button>
            <button class="btn-cancel" @click="hideConfirmDialog">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Delete confirm dialog -->
      <div v-if="deleteConfirmDialog.show" class="modal-overlay">
        <div class="confirm-dialog">
          <div class="confirm-content">
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja excluir este processo?</p>
            <p class="warning-text">Esta ação não poderá ser desfeita!</p>
            <div class="confirm-actions">
              <button class="btn-cancel" @click="hideDeleteDialog">Cancelar</button>
              <button class="btn-confirm delete" @click="confirmDelete">
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Systems dialog -->
      <div v-if="sistemasDialog.show" class="sistemas-dialog" :style="sistemasDialog.position">
        <h3>Selecionar Sistemas</h3>
        <div class="sistemas-dialog-content">
          <div class="sistemas-selected">
            <div v-for="id in editingCell.value" :key="id" class="sistema-chip">
              {{ getSistemaNome(id) }}
              <span @click.stop="removerSistema(id)" class="sistema-remove">×</span>
            </div>
          </div>
          <select multiple class="sistemas-select" @change="handleSistemasChange($event)">
            <option v-for="sistema in sistemasAtivos" :key="sistema.id" :value="sistema.id"
              :selected="editingCell.value && editingCell.value.includes(sistema.id)">
              {{ sistema.nome }}
            </option>
          </select>
          <div class="sistemas-dialog-actions">
            <button @click="saveSistemas" class="btn-confirm">Salvar</button>
            <button @click="hideSistemasDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Dialog para gerenciar distâncias -->
      <div v-if="distanciaDialog.show" class="distancia-dialog" :style="distanciaDialog.position">
        <div class="distancia-dialog-content">
          <div class="distancia-dialog-header">
            <h3>{{ distanciaDialog.processo?.numero_processo }} - Distâncias</h3>
            <button class="btn-icon close-icon" @click="fecharDistanciaDialog" title="Fechar">
              <img src="/icons/fechar.svg" alt="Fechar" class="icon-small">
            </button>
          </div>
          
          <div class="distancias-list">
            <table class="distancias-table">
              <thead>
                <tr>
                  <th>Distância (km)</th>
                  <th>Cidade</th>
                  <th>UF</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="distanciaDialog.distancias && distanciaDialog.distancias.length > 0">
                  <tr v-for="(distancia, index) in distanciaDialog.distancias" :key="distancia.id || index">
                    <td>{{ distancia.distancia_km }}</td>
                    <td>{{ distancia.ponto_referencia_cidade || distancia.cidade_destino || '-' }}</td>
                    <td>{{ distancia.ponto_referencia_uf || distancia.uf_destino || '-' }}</td>
                    <td class="distancia-acoes">
                      <button class="btn-icon edit" @click="iniciarEdicaoDistancia(distancia, index)" title="Editar">
                        <img src="/icons/edicao.svg" alt="Editar" class="icon-small">
                      </button>
                      <button class="btn-icon delete" @click="excluirDistancia(distancia, index)" title="Excluir">
                        <img src="/icons/lixeira.svg" alt="Excluir" class="icon-small">
                      </button>
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="4" class="no-records">Nenhuma distância cadastrada</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="distancia-form">
            <h4>{{ distanciaDialog.editandoIndex >= 0 ? 'Editar Distância' : 'Nova Distância' }}</h4>
            <div class="form-row">
              <div class="form-group">
                <label><i class="icon-label route"></i> Distância (km)</label>
                <input type="number" min="0" step="0.1" v-model="distanciaDialog.novaDistancia.distancia_km"
                  placeholder="Digite a distância" />
              </div>
              <div class="form-group">
                <label><i class="icon-label city"></i> Cidade</label>
                <input type="text" v-model="distanciaDialog.novaDistancia.ponto_referencia_cidade"
                  placeholder="Digite a cidade" />
              </div>
              <div class="form-group">
                <label><i class="icon-label uf"></i> UF</label>
                <select v-model="distanciaDialog.novaDistancia.ponto_referencia_uf">
                  <option value="">Selecione</option>
                  <option v-for="estado in estados" :key="estado.uf" :value="estado.uf">
                    {{ estado.uf }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="dialog-footer">
              <button v-if="distanciaDialog.editandoIndex >= 0" class="btn-cancel" @click="cancelarEdicaoDistancia">
                <img src="/icons/fechar.svg" alt="Cancelar" class="icon-small">
                Cancelar
              </button>
              <div class="spacer"></div>
              <button v-if="distanciaDialog.editandoIndex >= 0" class="btn-save" @click="salvarEdicaoDistancia">
                <img src="/icons/save-fill.svg" alt="Salvar" class="icon-small">
                Salvar Alterações
              </button>
              <button v-else class="btn-add" @click="adicionarDistancia">
                <img src="/icons/adicao.svg" alt="Adicionar" class="icon-small">
                Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Responsáveis dialog -->
      <div v-if="responsaveisDialog.show" class="sistemas-dialog" :style="responsaveisDialog.position">
        <h3>Selecionar Responsável</h3>
        <div class="sistemas-dialog-content">
          <div class="sistemas-selected">
            <div v-if="editingCell.value" class="sistema-chip">
              {{ getResponsavelProcessoNome(editingCell.value) }}
              <span @click.stop="removerResponsavel()" class="sistema-remove">×</span>
            </div>
          </div>
          <select class="sistemas-select" @change="handleResponsavelChange($event)">
            <option value="">Sem responsável</option>
            <option v-for="resp in responsaveisProcessos" :key="resp.id" :value="resp.id"
              :selected="editingCell.value === resp.id">
              {{ resp.nome }}
            </option>
          </select>
          <div class="sistemas-dialog-actions">
            <button @click="saveResponsavel" class="btn-confirm">Salvar</button>
            <button @click="hideResponsaveisDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Representantes dialog -->
      <div v-if="representantesDialog.show" class="sistemas-dialog" :style="representantesDialog.position">
        <h3>Selecionar Representante</h3>
        <div class="sistemas-dialog-content">
          <div class="sistemas-selected">
            <div v-if="editingCell.value" class="sistema-chip">
              {{ getRepresentanteNome(editingCell.value) }}
              <span @click.stop="removerRepresentante()" class="sistema-remove">×</span>
            </div>
          </div>
          <select class="sistemas-select" @change="handleRepresentanteChange($event)">
            <option value="">Sem representante</option>
            <option v-for="rep in representantes" :key="rep.id" :value="rep.id" :selected="editingCell.value === rep.id">
              {{ rep.nome }}
            </option>
          </select>
          <div class="sistemas-dialog-actions">
            <button @click="saveRepresentante" class="btn-confirm">Salvar</button>
            <button @click="hideRepresentantesDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Empresas dialog -->
      <div v-if="empresasDialog.show" class="sistemas-dialog" :style="empresasDialog.position">
        <h3>Selecionar Empresa</h3>
        <div class="sistemas-dialog-content">
          <div class="sistemas-selected">
            <div v-if="editingCell.value" class="sistema-chip">
              {{ getEmpresaNome(editingCell.value) }}
              <span @click.stop="removerEmpresa()" class="sistema-remove">×</span>
            </div>
          </div>
          <select class="sistemas-select" @change="handleEmpresaChange($event)">
            <option value="">Sem empresa</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id"
              :selected="editingCell.value === empresa.id">
              {{ empresa.nome }} <span v-if="empresa.cnpj" class="empresa-cnpj">({{ formatCNPJ(empresa.cnpj) }})</span>
            </option>
          </select>
          <div class="sistemas-dialog-actions">
            <button @click="saveEmpresa" class="btn-confirm">Salvar</button>
            <button @click="hideEmpresasDialog" class="btn-cancel">Cancelar</button>
          </div>
        </div>
      </div>

      <!-- Dialog para reagendamento de processos -->
      <div v-if="reagendamentoDialog.show" class="modal-overlay">
        <div class="confirm-dialog">
          <div class="confirm-content">
            <h3>{{ reagendamentoDialog.status === 'demonstracao' ? 'Agendamento de Demonstração' : 'Reagendamento do Processo' }}</h3>
            <p>O processo "{{ reagendamentoDialog.processo?.numero_processo }}" foi marcado como 
              {{ reagendamentoDialog.status === 'suspenso' ? 'SUSPENSO' : 
                 reagendamentoDialog.status === 'adiado' ? 'ADIADO' : 'DEMONSTRAÇÃO' }}.
            </p>
            <p>{{ reagendamentoDialog.status === 'demonstracao' ? 'Informe a data da demonstração:' : 'Já existe uma nova data para a reabertura deste processo?' }}</p>
            
            <div v-if="reagendamentoDialog.temNovaData || reagendamentoDialog.status === 'demonstracao'" class="form-row">
              <div class="form-group-reagendamento">
                <label>Nova Data</label>
                <input type="date" v-model="reagendamentoDialog.novaData" 
                       :min="reagendamentoDialog.dataOriginal" class="input-reagendamento" />
                <!-- <span v-if="reagendamentoDialog.novaData" class="ano-hint">
                  Ano: {{ new Date(reagendamentoDialog.novaData).getFullYear() }}
                </span> -->
                <span v-if="reagendamentoDialog.dataError" class="error-message">
                  {{ reagendamentoDialog.dataError }}
                </span>
              </div>
              <div class="form-group-reagendamento">
                <label>Nova Hora</label>
                <input type="time" v-model="reagendamentoDialog.novaHora" min="08:00" max="18:00" class="input-reagendamento" />
                <span v-if="reagendamentoDialog.horaError" class="error-message">
                  {{ reagendamentoDialog.horaError }}
                </span>
              </div>
            </div>
            
            <!-- Botões de ação no modal -->
            <div class="confirm-actions">
              <button class="btn-cancel" @click="hideReagendamentoDialog">Cancelar</button>
              <button v-if="!reagendamentoDialog.temNovaData || reagendamentoDialog.status === 'demonstracao'" 
                class="btn-secondary" 
                @click="confirmSemNovaData">
                Não, apenas alterar o status
              </button>
              <button v-if="!reagendamentoDialog.temNovaData && reagendamentoDialog.status !== 'demonstracao'" 
                class="btn-confirm" 
                @click="confirmarTemNovaData">
                Sim, informar nova data
              </button>
              <button v-if="reagendamentoDialog.temNovaData || reagendamentoDialog.status === 'demonstracao'" 
                class="btn-confirm" 
                @click="confirmarReagendamento" 
                :disabled="!reagendamentoDialog.novaData || !reagendamentoDialog.novaHora">
                Confirmar {{ reagendamentoDialog.status === 'demonstracao' ? 'Demonstração' : 'Reagendamento' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Diálogo para detalhes de análise -->
      <div v-if="analiseDialog.show" class="modal-overlay">
        <div class="confirm-dialog analise-dialog">
          <div class="confirm-content">
            <h3>Detalhes da Análise</h3>
            <p>Processo: {{ analiseDialog.processo?.numero_processo }}</p>
            
            <div class="form-row">
              <div class="form-group">
                <label>Código de análise no GPI</label>
                <input v-model="analiseDialog.codigoGPI" 
                  type="text" 
                  placeholder="Digite o código GPI" 
                  required 
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Prazo final para resposta da análise</label>
                <input v-model="analiseDialog.prazoResposta" 
                  type="date" 
                  :min="new Date().toISOString().split('T')[0]" 
                  required 
                />
              </div>
            </div>
            
            <div class="confirm-actions">
              <button class="btn-cancel" @click="hideAnaliseDialog">Cancelar</button>
              <button 
                class="btn-confirm" 
                :disabled="!this.analiseDialog.codigoGPI || !this.analiseDialog.prazoResposta"
                @click="salvarAnalise" >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Diálogo para registro de impugnação -->
      <div v-if="impugnacaoDialog.show" class="modal-overlay impugnacao-modal-overlay">
        <div class="confirm-dialog impugnacao-dialog impugnacao-dialog-container">
          <h3 class="impugnacao-dialog-title">Registro de Impugnação</h3>
          <div class="confirm-content impugnacao-dialog-content">
            <p class="impugnacao-processo-info">Processo: {{ impugnacaoDialog.processo?.numero_processo }}</p>
            
            <div class="impugnacao-info impugnacao-info-container">
              <div class="impugnacao-alert impugnacao-alert-box">
                <h4 class="impugnacao-alert-title">⚠️ Informações importantes sobre impugnações:</h4>
                <div class="impugnacao-alert-content impugnacao-alert-content-box">
                  <p class="impugnacao-section-title"><strong class="impugnacao-strong-text">Itens Mais Impugnados em Editais:</strong></p>
                  <ul class="impugnacao-items-list">
                    <li>Exigências técnicas excessivas</li>
                    <li>Critérios de julgamento subjetivos</li>
                    <li>Prazos exíguos para apresentação de propostas</li>
                    <li>Falta de clareza nas especificações do objeto</li>
                  </ul>
                  
                  <p class="impugnacao-section-title"><strong class="impugnacao-strong-text">Cuidados ao Elaborar Impugnações:</strong></p>
                  <ul class="impugnacao-care-list">
                    <li>Verificar conformidade com a Lei 14.133</li>
                    <li>Garantir clareza e objetividade nas especificações</li>
                    <li>Estabelecer prazos razoáveis para apresentação de propostas</li>
                    <li>Evitar exigências técnicas desnecessárias</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div class="form-row impugnacao-form-row">
              <div class="form-group impugnacao-form-group">
                <label class="impugnacao-label">Data limite para impugnação</label>
                <input 
                  class="impugnacao-date-input"
                  type="date" 
                  v-model="impugnacaoDialog.dataLimite" 
                  :min="new Date().toISOString().split('T')[0]"
                />
              </div>
              
              <div class="form-group impugnacao-form-group">
                <label class="impugnacao-label">Status da impugnação</label>
                <select class="impugnacao-status-select" v-model="impugnacaoDialog.status">
                  <option class="impugnacao-status-option" value="nao_iniciado">Não iniciado</option>
                  <option class="impugnacao-status-option" value="em_andamento">Em andamento</option>
                  <option class="impugnacao-status-option" value="enviado">Enviado</option>
                  <option class="impugnacao-status-option" value="respondido">Respondido</option>
                  <option class="impugnacao-status-option" value="aprovado">Aprovado</option>
                  <option class="impugnacao-status-option" value="rejeitado">Rejeitado</option>
                </select>
              </div>
            </div>
            
            <div class="form-row single impugnacao-form-row-single">
              <div class="form-group impugnacao-form-group">
                <label class="impugnacao-label">Forma de envio da impugnação</label>
                <select class="impugnacao-forma-select" v-model="impugnacaoDialog.formaEnvio">
                  <option class="impugnacao-forma-option" value="">Selecione a forma de envio</option>
                  <option class="impugnacao-forma-option" value="email">E-mail</option>
                  <option class="impugnacao-forma-option" value="portal">Portal do órgão</option>
                  <option class="impugnacao-forma-option" value="fisico">Físico (Protocolo)</option>
                  <option class="impugnacao-forma-option" value="outro">Outro</option>
                </select>
                <input 
                  v-if="impugnacaoDialog.formaEnvio === 'outro'"
                  v-model="impugnacaoDialog.formaEnvioOutro"
                  class="impugnacao-outro-input"
                  type="text"
                  placeholder="Especifique a forma de envio"
                />
              </div>
            </div>
            
            <div class="form-row single impugnacao-form-row-single">
              <div class="form-group impugnacao-form-group">
                <label class="impugnacao-label">Itens a impugnar</label>
                <textarea 
                  class="impugnacao-itens-textarea" 
                  rows="6" 
                  placeholder="Descreva os itens que serão impugnados..."
                  v-model="impugnacaoDialog.itens"
                ></textarea>
              </div>
            </div>
            
            <div class="form-row single">
              <div class="form-group">
                <label>Observações adicionais</label>
                <textarea 
                  rows="4" 
                  placeholder="Adicione observações relevantes sobre a impugnação..."
                  v-model="impugnacaoDialog.observacoes"
                ></textarea>
              </div>
            </div>
          </div>
          
          <div class="confirm-actions">
            <button class="btn-cancel" @click="hideImpugnacaoDialog">Cancelar</button>
            <button 
              class="btn-confirm" 
              @click="salvarImpugnacao"
              :disabled="!impugnacaoDialog.dataLimite || !impugnacaoDialog.itens || !impugnacaoDialog.formaEnvio"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>

      <div class="toast-container">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
          {{ toast.message }}
        </div>
      </div>

      <!-- Tour component -->
      <Shepherd 
        ref="tourGuide" 
        :steps="tourSteps" 
        :showButton="false"
        @complete="onTourComplete"
        @cancel="onTourCancel"
      />

      <!-- Balão de informações de status -->
      <div v-if="statusInfoBalloon.show" class="status-info-balloon" :style="statusInfoBalloon.position">
        <div class="balloon-arrow"></div>
        <div class="balloon-content">
          <span class="info-icon">ℹ️</span>
          <span class="info-text">
            Notificações automáticas ativadas. 
            Próxima notificação: {{ statusInfoBalloon.nextNotification || 'calculando...' }}
          </span>
        </div>
      </div>

      <!-- Modal para selecionar sistemas a implantar -->
      <div 
        v-if="sistemasImplantacaoDialog.show" 
        class="modal-overlay"
      >
        <div class="sistemas-implantacao-modal">
          <div class="modal-header">
            <h3>Sistemas a Implantar</h3>
            <button class="btn-close" @click="hideSistemasImplantacaoDialog">×</button>
          </div>
          <div class="modal-body">
            <SistemasImplantacaoSelector
              v-if="sistemasImplantacaoDialog.processo"
              :processo-id="sistemasImplantacaoDialog.processo ? sistemasImplantacaoDialog.processo.id : ''"
              :sistemas-ativos="sistemasImplantacaoDialog.processo ? getSistemasAtivosDoProcesso(sistemasImplantacaoDialog.processo) : []"
              :value="sistemasImplantacaoDialog.processo ? getSistemasImplantacaoValue(sistemasImplantacaoDialog.processo) : null"
              @save="handleSistemaImplantacaoSave"
              @cancel="hideSistemasImplantacaoDialog"
            />
          </div>
        </div>
      </div>

      <!-- Adicionar o componente de diálogo de duplicação -->
      <DuplicateProcessDialog
        :show="duplicateDialog.show"
        :processo="duplicateDialog.processo || {}"
        :loading="duplicateDialog.loading"
        @close="hideDuplicateDialog"
        @duplicate="executarDuplicacao"
      />

      <!-- Adicionar o diálogo de empresa vencedora -->
      <EmpresaVencedoraDialog
        :show="empresaVencedoraDialog.show"
        :processoId="empresaVencedoraDialog.processoId"
        :dadosAtuais="empresaVencedoraDialog.dadosAtuais"
        @fechar="closeEmpresaVencedoraDialog"
        @salvar="saveEmpresaVencedora"
      />

    </div>
  </div>
</template>

<script>
// Import the component logic from the separate JS file
import { ref } from 'vue'; // Adicionando importação do ref
import ProcessosViewModel from './ProcessosView.js';
import Shepherd from '@/components/Shepherd.vue';
import { supabase } from '@/lib/supabase'; // Adicione esta importação
import EmpresaVencedoraColuna from '../components/EmpresaVencedoraColuna.vue';
import EmpresaVencedoraDialog from '../components/EmpresaVencedoraDialog.vue';
import AcoesColumn from '@/components/columns/table/AcoesColumn.vue';
import AdvancedFilterComponent from '@/components/filters/AdvancedFilterComponent.vue'; // Importação do componente
import DuplicateProcessDialog from '@/components/dialogs/DuplicateProcessDialog.vue';
import SistemasImplantacaoSelector from '@/components/SistemasImplantacaoSelector.vue'; // Importando o novo componente

// Para uso no Vue DevTools ou em um componente temporário
async function checkTableStructure() {
  const { data, error } = await supabase
    .from('notification_schedules')
    .select('*')
    .limit(1);
  
  if (data && data.length > 0) {
    console.log("Estrutura da tabela:", Object.keys(data[0]));
  } else {
    console.log("Não foi possível obter a estrutura da tabela");
  }
}

// Certifique-se de que a função showToast está disponível no escopo
const showToast = (message, type = 'success', duration = 3000) => {
  const id = Date.now();
  toasts.value.push({ id, message, type });
  
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }, duration);
};

// Estado para o diálogo de sistemas a implantar
const sistemasImplantacaoDialog = ref({
  show: false,
  position: {},
  processo: null
});

// Export the component with the imported logic
export default {
  ...ProcessosViewModel,
  components: {
    ...ProcessosViewModel.components || {},
    Shepherd,
    EmpresaVencedoraColuna,
    EmpresaVencedoraDialog,
    AcoesColumn,
    AdvancedFilterComponent, // Adicionar o novo componente
    DuplicateProcessDialog,
    SistemasImplantacaoSelector
  },
  data() {
    const baseData = typeof ProcessosViewModel.data === 'function' 
      ? ProcessosViewModel.data() 
      : {};
    
    return {
      ...baseData,
      colunas: [
        ...baseData.colunas || [],
        { 
          name: 'sistemas_implantacao', 
          label: 'Sistemas a Implantar', 
          field: 'sistemas_implantacao',
          sortable: false
        }
      ],
      // Variáveis para controle do modal de sistemas a implantar
      showSistemasImplantacaoModal: false,
      processoSelecionadoImplantacao: null,
      tourSteps: [
        {
          id: 'intro',
          title: 'Bem-vindo ao Sistema de Processos Licitatórios',
          text: 'Este tour irá guiá-lo pelos principais recursos e funcionalidades desta tela.',
          attachTo: {
            element: '.header-processos',
            on: 'bottom'
          },
          buttons: [
            {
              text: 'Pular Tour',
              action: function() { return this.cancel(); },
              classes: 'shepherd-button-secondary'
            },
            {
              text: 'Próximo',
              action: function() { return this.next(); },
              classes: 'shepherd-button-primary'
            }
          ]
        },
        {
          id: 'actionButtons',
          title: 'Ações Rápidas',
          text: 'Aqui você encontra os botões para desfazer e refazer alterações, iniciar este tour, exportar dados para Excel e adicionar novos processos.',
          attachTo: {
            element: '.actions',
            on: 'bottom'
          },
          buttons: [
            {
              text: 'Voltar',
              action: function() { return this.back(); },
              classes: 'shepherd-button-secondary'
            },
            {
              text: 'Próximo',
              action: function() { return this.next(); },
              classes: 'shepherd-button-primary'
            }
          ]
        },
        {
          id: 'tabela',
          title: 'Tabela de Processos',
          text: 'Todos os processos licitatórios são listados nesta tabela. Você pode clicar duas vezes em uma célula para editar seu conteúdo.',
          attachTo: {
            element: '.table-container',
            on: 'top'
          },
          buttons: [
            {
              text: 'Voltar',
              action: function() { return this.back(); },
              classes: 'shepherd-button-secondary'
            },
            {
              text: 'Próximo',
              action: function() { return this.next(); },
              classes: 'shepherd-button-primary'
            }
          ]
        },
        {
          id: 'filtros',
          title: 'Filtros',
          text: 'Use os ícones de filtro nas colunas para filtrar os dados por valores específicos.',
          attachTo: {
            element: '.filtro-container',
            on: 'right'
          },
          buttons: [
            {
              text: 'Voltar',
              action: function() { return this.back(); },
              classes: 'shepherd-button-secondary'
            },
            {
              text: 'Próximo',
              action: function() { return this.next(); },
              classes: 'shepherd-button-primary'
            }
          ]
        },
        {
          id: 'anosTabs',
          title: 'Navegação por Anos',
          text: 'Use estas abas para navegar entre processos de diferentes anos.',
          attachTo: {
            element: '.anos-tabs',
            on: 'top'
          },
          buttons: [
            {
              text: 'Voltar',
              action: function() { return this.back(); },
              classes: 'shepherd-button-secondary'
            },
            {
              text: 'Próximo',
              action: function() { return this.next(); },
              classes: 'shepherd-button-primary'
            }
          ]
        },
        {
          id: 'concluir',
          title: 'Tour Concluído!',
          text: 'Agora você conhece os principais recursos desta tela. Explore e aproveite o sistema!',
          buttons: [
            {
              text: 'Concluir',
              action: function() { return this.complete(); },
              classes: 'shepherd-button-primary'
            }
          ]
        }
      ],
      empresaVencedoraDialog: {
        show: false,
        processoId: null,
        dadosAtuais: ''
      }
    };
  },
  methods: {
    ...ProcessosViewModel.methods,
    
    // Método para obter contagem de sistemas a implantar de um processo
    getSistemasImplantacaoCount(processo) {
      if (!processo || !processo.sistemas_implantacao) return 0;
      
      try {
        // Se for string mas não for JSON válido, retorna 0
        if (typeof processo.sistemas_implantacao === 'string') {
          // Verificar se a string começa com '{' ou '[' antes de tentar parsear
          if (processo.sistemas_implantacao.trim().startsWith('{') || 
              processo.sistemas_implantacao.trim().startsWith('[')) {
            try {
              const dadosSistemas = JSON.parse(processo.sistemas_implantacao);
              return dadosSistemas && dadosSistemas.sistemas_ids ? dadosSistemas.sistemas_ids.length : 0;
            } catch (e) {
              console.log('Valor não é um JSON válido:', processo.sistemas_implantacao);
              return 0;
            }
          } else {
            return 0; // Não é uma string JSON
          }
        }
        
        // Se já for objeto
        if (typeof processo.sistemas_implantacao === 'object' && processo.sistemas_implantacao !== null) {
          return processo.sistemas_implantacao.sistemas_ids ? 
            processo.sistemas_implantacao.sistemas_ids.length : 0;
        }
        
        return 0;
      } catch (error) {
        console.error('Erro ao obter contagem de sistemas a implantar:', error);
        return 0;
      }
    },
    
    // Método para obter sistemas ativos do processo
    getSistemasAtivosDoProcesso(processo) {
      if (!processo || !processo.sistemas_ativos) {
        return [];
      }
    
      try {
        // Se for string, tentar parsear
        if (typeof processo.sistemas_ativos === 'string') {
          if (processo.sistemas_ativos.trim().startsWith('[') || 
              processo.sistemas_ativos.trim().startsWith('{')) {
            try {
              return JSON.parse(processo.sistemas_ativos);
            } catch (e) {
              console.error('Erro ao parsear sistemas_ativos:', e);
              return [];
            }
          } else {
            return [];
          }
        }
    
        // Se já for array
        if (Array.isArray(processo.sistemas_ativos)) {
          return processo.sistemas_ativos;
        }
        
        return [];
      } catch (e) {
        console.error('Erro ao processar sistemas_ativos:', e);
        return [];
      }
    },
    
    // Método para obter valor atual de sistemas_implantacao
    getSistemasImplantacaoValue(processo) {
      if (!processo || !processo.sistemas_implantacao) {
        return { sistemas_ids: [], informacoes_adicionais: '' };
      }
    
      try {
        // Se for string, tentar parsear
        if (typeof processo.sistemas_implantacao === 'string') {
          if (processo.sistemas_implantacao.trim().startsWith('{') || 
              processo.sistemas_implantacao.trim().startsWith('[')) {
            try {
              const parsed = JSON.parse(processo.sistemas_implantacao);
              return parsed;
            } catch (e) {
              console.error('Erro ao parsear sistemas_implantacao:', e);
              return { sistemas_ids: [], informacoes_adicionais: '' };
            }
          } else {
            return { sistemas_ids: [], informacoes_adicionais: '' };
          }
        }
    
        // Se já for objeto
        if (processo.sistemas_implantacao && typeof processo.sistemas_implantacao === 'object') {
          return processo.sistemas_implantacao;
        }
        
        return { sistemas_ids: [], informacoes_adicionais: '' };
      } catch (e) {
        console.error('Erro ao processar sistemas_implantacao:', e);
        return { sistemas_ids: [], informacoes_adicionais: '' };
      }
    },
    
    startTour() {
      if (this.$refs.tourGuide) {
        this.$refs.tourGuide.startTour();
      } else {
        console.error('Tour guide reference not found');
      }
    },
    
    onTourComplete() {
      if (typeof this.showToast === 'function') {
        this.showToast('Tour concluído! Aproveite o sistema.', 'success');
      }
    },
    
    onTourCancel() {
      if (typeof this.showToast === 'function') {
        this.showToast('Tour cancelado. Você pode iniciá-lo novamente a qualquer momento.', 'info');
      }
    },
    
    /**
     * Abre o diálogo para editar empresa vencedora
     */
    openEmpresaVencedoraDialog(processo) {
      console.log('openEmpresaVencedoraDialog chamado diretamente', processo);
      
      // Importar o emitter global
      import('@/utils/eventBus').then(module => {
        const emitter = module.default;
        
        // Emitir evento global para abrir o modal
        emitter.emit('openEmpresaVencedoraModal', {
          processoId: processo.id,
          dadosAtuais: processo.empresa_vencedora || ''
        });
        
        console.log('✅ Evento emitido: openEmpresaVencedoraModal');
      });

      // Manter essa atribuição para compatibilidade com o código existente
      this.empresaVencedoraDialog = {
        show: true,
        processoId: processo.id,
        dadosAtuais: processo.empresa_vencedora || ''
      };
    },
    
    /**
     * Fecha o diálogo de empresa vencedora
     */
    closeEmpresaVencedoraDialog() {
      this.empresaVencedoraDialog.show = false;
    },
    
    /**
     * Salva os dados da empresa vencedora
     */
    async saveEmpresaVencedora({ processoId, empresaVencedora }) {
      try {
        this.loading = true;
        
        // Atualizar os dados no banco
        const { error } = await supabase
          .from('processos')
          .update({ empresa_vencedora: empresaVencedora })
          .eq('id', processoId);
          
        if (error) throw error;
        
        // Registrar no log do sistema
        await this.logSystemAction({
          tipo: 'update',
          tabela: 'processos',
          registro_id: processoId,
          campo: 'empresa_vencedora',
          dados_novos: empresaVencedora
        });
        
        // Atualizar a lista de processos
        await this.loadProcessos();
        
        // Mostrar notificação de sucesso
        this.showToast('Informações da empresa vencedora atualizadas com sucesso!', 'success');
        
      } catch (error) {
        console.error('Erro ao salvar empresa vencedora:', error);
        this.showToast(`Erro ao salvar: ${error.message}`, 'error');
      } finally {
        this.loading = false;
      }
    },
    
    // Função para salvar os detalhes da análise
    async salvarAnalise() {
      try {
        if (!this.analiseDialog.processo || !this.analiseDialog.codigoGPI || !this.analiseDialog.prazoResposta) {
          this.showToast('Preencha todos os campos obrigatórios', 'error');
          return;
        }

        // Formatar a data corretamente para o banco
        const prazoFormatado = this.analiseDialog.prazoResposta instanceof Date 
          ? this.analiseDialog.prazoResposta.toISOString().split('T')[0] 
          : this.analiseDialog.prazoResposta;

        // 1. Atualizar o registro do processo com o código de análise
        const updateData = {
          codigo_analise: this.analiseDialog.codigoGPI,
          codigo_gpi: this.analiseDialog.codigoGPI,
          prazo_analise: prazoFormatado,
          updated_at: new Date().toISOString()
        };

        // Adicionar usuário que está fazendo a alteração
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          updateData.updated_by = user.id;
        }

        // Atualizar no banco de dados
        const { error } = await supabase
          .from('processos')
          .update(updateData)
          .eq('id', this.analiseDialog.processo.id);

        if (error) throw error;

        // 2. Programar notificação para o prazo final
        const notificationData = {
          processo_id: this.analiseDialog.processo.id,
          status: 'analise',
          message: `Prazo final para análise do processo ${this.analiseDialog.processo.numero_processo} (Código GPI: ${this.analiseDialog.codigoGPI})`,
          next_notification: new Date(prazoFormatado).toISOString(),
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString(),
          active: true
        };

        // Inserir no sistema de notificações
        const { error: notificationError } = await supabase
          .from('notification_schedules')
          .insert(notificationData);

        if (notificationError) throw notificationError;

        // Recarregar os dados - IMPORTANTE: Use a função do seu ViewModel
        try {
          if (ProcessosViewModel.methods && ProcessosViewModel.methods.loadProcessos) {
            await ProcessosViewModel.methods.loadProcessos();
          } else {
            // Fallback: carregar de outra forma
            const { data } = await supabase
              .from('processos')
              .select('*')
              .order('data_pregao', { ascending: true })
              .order('created_at', { ascending: true });
              
            if (data) {
              // Atualizar os dados no componente
              this.$root.$emit('processos-updated', data);
            }
          }
        } catch (loadError) {
          console.error('Erro ao recarregar processos:', loadError);
        }
        
        // Fechar o diálogo
        this.hideAnaliseDialog();
        
        // Mostrar mensagem de sucesso
        this.showToast(`Análise registrada com sucesso! Código GPI: ${this.analiseDialog.codigoGPI}. Notificação agendada para ${this.formatDate(prazoFormatado)}`, 'success', 5000);
      } catch (error) {
        console.error('Erro ao salvar análise:', error);
        this.showToast('Erro ao salvar os detalhes da análise: ' + error.message, 'error');
      }
    },
    
    // Adicione esta função aos methods
    async logSystemAction(dados) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        const logData = {
          usuario_id: user.id,
          usuario_email: user.email,
          tipo: dados.tipo,
          tabela: dados.tabela,
          registro_id: dados.registro_id,
          dados_anteriores: dados.dados_anteriores,
          dados_novos: dados.dados_novos,
          data_hora: new Date().toISOString()
        };
    
        const { error } = await supabase
          .from('system_logs')
          .insert(logData);
    
        if (error) throw error;
      } catch (error) {
        console.error('Error logging action:', error);
      }
    },
    
    async loadProcessos() {
      try {
        this.loading = true;
        
        // Carregar processos do Supabase, ordenados por created_at ou id
        const { data, error } = await supabase
          .from('processos')
          .select('*')
          .order('created_at', { ascending: true })  // Garante ordem fixa por data de criação
          .order('id', { ascending: true });         // Ordenação secundária pelo ID
        
        if (error) throw error;
        
        // Processar dados
        await this.processarProcessos(data);
        
        this.loading = false;
      } catch (error) {
        console.error('Erro ao carregar processos:', error);
        this.showToast('Erro ao carregar processos', 'error');
        this.loading = false;
      }
    },
    
    // Função para formatar valores monetários
    formatarMoeda(valor) {
      if (!valor || isNaN(parseFloat(valor))) return 'R$ -';
      
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(parseFloat(valor));
    },

    getResponsavelProcessoNome(id) {
      if (!id) return 'Sem responsável';
      
      const responsavel = this.responsaveisProcessos.find(r => r.id === id);
      return responsavel ? responsavel.nome : 'Responsável desconhecido';
    },
    
    handleResponsavelChange(event) {
      const responsavelId = event.target.value;
      console.log('handleResponsavelChange chamado:', { responsavelId });
      
      // Quando seleciona "Sem responsável", definimos o valor como null
      if (!responsavelId || responsavelId === '') {
        this.editingCell.value = null;
        console.log('Responsável definido como null (sem responsável)');
        return;
      }
      
      // Buscar o nome do responsável para exibição no textarea
      const responsavel = this.responsaveisProcessos.find(r => r.id === responsavelId);
      console.log('Responsável encontrado:', responsavel);
      
      // Vamos apenas armazenar o ID, já que é o que o banco precisa
      this.editingCell.value = responsavelId;
    },
    
    saveResponsavel() {
      console.log('saveResponsavel chamado', {
        editingCell: this.editingCell,
        editingProcess: this.editingProcess,
        processos: this.processos ? this.processos.length : 0
      });

      if (!this.editingCell) {
        console.error('Erro: editingCell não está definido');
        this.showToast('Erro ao salvar responsável: dados de célula ausentes', 'error');
        return;
      }

      // Encontrar o processo correto usando o ID armazenado em editingCell
      const processoId = this.editingCell.id;
      const processo = this.processos.find(p => p.id === processoId);
      
      console.log('Buscando processo:', { 
        processoId, 
        encontrado: !!processo,
        detalhes: processo 
      });

      if (!processo) {
        console.error('Erro: Processo não encontrado com ID:', processoId);
        this.showToast('Erro ao salvar responsável: processo não encontrado', 'error');
        return;
      }
      
      // Criar uma cópia do processo para atualização
      const updatedProcess = { ...processo };
      
      // Atribuir o novo valor do responsável (que pode ser null)
      updatedProcess.responsavel_id = this.editingCell.value;
      
      // Construir uma mensagem apropriada para o log e toast
      const responsavelNome = this.editingCell.value ? 
        this.getResponsavelProcessoNome(this.editingCell.value) : 
        'Sem responsável';
        
      console.log('Atualizando responsável:', {
        processoId: updatedProcess.id,
        processoNumero: updatedProcess.numero_processo,
        responsavelIdAntigo: processo.responsavel_id,
        responsavelIdNovo: updatedProcess.responsavel_id,
        responsavelNome
      });
      
      // Executar atualização e verificar o resultado
      this.updateProcesso(updatedProcess)
        .then(success => {
          if (success) {
            // Esconder o diálogo
            this.hideResponsaveisDialog();
            
            // Mostrar mensagem de confirmação com texto correto
            this.showToast(`Responsável atualizado com sucesso para: ${responsavelNome}`, 'success');
            
            // Atualizar a visualização na interface
            this.$forceUpdate();
          }
        })
        .catch(error => {
          console.error('Erro na atualização do responsável:', error);
          this.showToast(`Erro ao atualizar responsável: ${error.message}`, 'error');
        });
    },
    
    async updateProcesso(processo) {
      console.log('updateProcesso chamado', { 
        id: processo.id, 
        numero: processo.numero_processo,
        responsavel_id: processo.responsavel_id
      });
      
      try {
        // Criar uma cópia do objeto para não modificar o original
        const processToUpdate = { ...processo };
        
        // Garantir que campos com valor null sejam enviados explicitamente
        // para o banco como null e não sejam ignorados na atualização
        if (processo.responsavel_id === null) {
          console.log('Enviando responsavel_id como NULL explicitamente');
          processToUpdate.responsavel_id = null;
        }
        
        // Registrar a atualização para histórico de ações
        if (this.undoHistory) {
          const currentProcess = this.processos.find(p => p.id === processo.id);
          if (currentProcess) {
            this.undoHistory.push({
              type: 'update',
              id: processo.id,
              oldData: { ...currentProcess },
              newData: { ...processToUpdate }
            });
            // Limpar o redo history quando uma nova ação é executada
            this.redoHistory = [];
          }
        }
        
        // Adicionar timestamp e usuário de atualização
        processToUpdate.updated_at = new Date().toISOString();
        
        // Se estiver disponível, adicionar o usuário que fez a alteração
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          processToUpdate.updated_by = user.id;
        }
        
        console.log('Enviando dados para atualização:', processToUpdate);
        
        // Realizar a atualização no banco de dados
        const { error } = await supabase
          .from('processos')
          .update(processToUpdate)
          .eq('id', processo.id);
        
        if (error) {
          console.error('Erro na atualização do processo:', error);
          this.showToast(`Erro ao atualizar o processo: ${error.message}`, 'error');
          throw error;
        }
        
        console.log('Processo atualizado com sucesso:', processo.id);
        
        // Atualizar o processo na lista local
        const index = this.processos.findIndex(p => p.id === processo.id);
        if (index !== -1) {
          this.processos[index] = { ...processToUpdate };
        }
        
        // Registrar a alteração no log do sistema
        await this.logSystemAction({
          tipo: 'update',
          tabela: 'processos',
          registro_id: processo.id,
          dados_anteriores: this.processos.find(p => p.id === processo.id),
          dados_novos: processToUpdate
        });
        
        return true;
      } catch (error) {
        console.error('Erro na atualização:', error);
        this.showToast(`Erro ao atualizar dados: ${error.message}`, 'error');
        return false;
      }
    },
    
    // Mostra o diálogo de sistemas a implantar
    openSistemasImplantacaoDialog(processo) {
      this.sistemasImplantacaoDialog = {
        show: true,
        processo: processo,
        position: {
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)'
        }
      };
    },
    
    // Esconde o diálogo de sistemas a implantar
    hideSistemasImplantacaoDialog() {
      this.sistemasImplantacaoDialog = {
        show: false,
        processo: null,
        position: {}
      };
    },
    
    // Atualiza os sistemas a implantar de um processo
    async atualizarSistemasImplantacao(processo, dados) {
      try {
        const { error } = await supabase
          .from('processos')
          .update({
            sistemas_implantacao: dados,
            updated_at: new Date().toISOString()
          })
          .eq('id', processo.id);
          
        if (error) throw error;
        
        await this.logSystemAction({
          tipo: 'atualizacao',
          tabela: 'processos',
          registro_id: processo.id,
          campo_alterado: 'sistemas_implantacao',
          dados_anteriores: JSON.stringify(processo.sistemas_implantacao || {}),
          dados_novos: JSON.stringify(dados)
        });
        
        await this.loadProcessos();
        
        this.hideSistemasImplantacaoDialog();
        
        this.showToast('Sistemas a implantar atualizados com sucesso', 'success');
      } catch (error) {
        console.error('Erro ao atualizar sistemas a implantar:', error);
        this.showToast('Erro ao atualizar sistemas a implantar', 'error');
      }
    },
    
    // Retorna os sistemas disponíveis para implantação (apenas os que já foram selecionados no processo)
    sistemasDisponiveis(processo) {
      if (!processo || !processo.sistemas_ativos || processo.sistemas_ativos.length === 0) {
        return [];
      }
      
      return this.sistemasAtivos.filter(sistema => 
        processo.sistemas_ativos.includes(sistema.id)
      );
    },
    
    // Tratar salvamento de sistemas a implantar
    handleSistemaImplantacaoSave(dados) {
      if (!this.sistemasImplantacaoDialog.processo) return;
      
      this.atualizarSistemasImplantacao(
        this.sistemasImplantacaoDialog.processo,
        dados
      );
    },

    // Método para abrir o diálogo quando clicado na célula
    showSistemasImplantacaoDialog(processo, event) {
      // Evitar propagação do evento para não acionar múltiplas ações
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      
      console.log('Abrindo modal de sistemas a implantar para processo:', processo.id);
      
      this.sistemasImplantacaoDialog = {
        show: true,
        processo: processo,
        position: {
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)'
        }
      };
    },

    // Método para resetar configurações da tabela
    resetarConfiguracaoTabela() {
      try {
        // Resetar ordem das colunas
        this.ordenarColunas = [...this.colunasOriginais];

        // Resetar largura das colunas
        this.colunasWidth = { ...this.colunasWidthOriginais };

        // Mostrar mensagem de sucesso
        this.showToast('Configurações da tabela resetadas com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao resetar configurações da tabela:', error);
        this.showToast('Erro ao resetar configurações da tabela.', 'error');
      }
    }
  }
};
</script>

<style src="@/assets/styles/ProcessosView.css"></style>
<style src="/src/assets/styles/modules/toast.css"></style>
<style scoped>
.form-group-reagendamento {
  display: flex;
  gap: 1rem;
  flex-direction: column;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: center;
  align-items: center;
}

.input-reagendamento {
  width: 65% ! important;
  border: 1.5px solid rgb(116, 116, 116);
  border-radius: 4px;
  height: 42px;
  padding: 10px 7px 10px 12px;
}

.valor-monetario {  
  white-space: nowrap;  
}

.impugnacoes-cell {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.impugnacao-item {
  display: flex;
  justify-content: space-between;
}

.impugnacao-label {
  font-weight: bold;
}

.impugnacao-status {
  font-weight: bold;
}

.impugnacao-text {
  white-space: pre-wrap;
}

.empty-impugnacao {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-impugnacao {
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: 0.5rem;
}
</style>
<style>
@import '../assets/styles/components/empresa-vencedora.css';
</style>