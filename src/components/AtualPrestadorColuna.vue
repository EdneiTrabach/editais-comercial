// filepath: src/components/AtualPrestadorColuna.vue
<template>
  <div class="empresa-vencedora-coluna">
    <div v-if="isEditing" class="editing-mode">
      <div class="edit-container">
        <select v-model="selectedEmpresa" class="empresa-select">
          <option value="">Selecione o atual prestador...</option>
          <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
            {{ empresa.nome }}
          </option>
        </select>
        <input v-model="numeroContrato" class="contrato-input" placeholder="Nº do Contrato" type="text" />
        <div class="edit-actions">
          <button @click="saveAtualPrestador" class="btn-save">Salvar</button>
          <button @click="cancelEdit" class="btn-cancel">Cancelar</button>
        </div>
      </div>
    </div>
    <div v-else class="display-mode" @dblclick="startEdit">
      <div v-if="empresaNome || numeroContrato" class="info-container">
        <div v-if="empresaNome" class="empresa-nome">{{ empresaNome }}</div>
        <div v-if="numeroContrato" class="contrato-numero">Contrato: {{ numeroContrato }}</div>
      </div>
      <span v-else class="sem-empresa">Não definida</span>
    </div>
  </div>
</template>

<script>
import { useEmpresaVencedora } from '@/composables/useEmpresaVencedora'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export default {
  name: 'AtualPrestadorColuna',
  props: { processo: { type: Object, required: true } },
  emits: ['update'],
  setup(props, ctx) {
    // Use o composable normalmente
    const {
      processoId,
      selectedEmpresa,
      numeroContrato,
      valorFinal,
      dataAssinatura,
      observacoes,
      empresas,
      isEditing,
      empresaNome,
      startEdit,
      cancelEdit
    } = useEmpresaVencedora(props, ctx.emit, 'empresa_atual_prestadora')

    const saveAtualPrestador = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const payload = {
          processo_id: props.processo.id,
          empresa_id: selectedEmpresa.value,
          numero_contrato: numeroContrato.value,
          valor_final: valorFinal.value,
          data_assinatura: dataAssinatura.value,
          observacoes: observacoes.value,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null
        }

        // Upsert: insere ou atualiza se já existir
        const { error } = await supabase
          .from('processos_empresa_atual_prestadora')
          .upsert(payload, { onConflict: 'processo_id' })

        if (error) throw error

        // Opcional: emitir evento para atualizar a tabela de processos na tela
        ctx.emit('update')

        isEditing.value = false
      } catch (error) {
        alert('Erro ao salvar atual prestador: ' + (error.message || error))
      }
    }

    const updateProcesso = async (editingCell, updateData) => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (editingCell.value.field === 'empresa_atual_prestadora') {
          // Atualize na tabela correta
          const payload = {
            processo_id: props.processo.id,
            empresa_id: editingCell.value.value,
            updated_at: new Date().toISOString(),
            updated_by: user?.id || null
          }
          const { error } = await supabase
            .from('processos_empresa_atual_prestadora')
            .upsert(payload, { onConflict: 'processo_id' });
          if (error) throw error;
        } else {
          // Atualização normal
          const { error } = await supabase
            .from('processos')
            .update(updateData)
            .eq('id', props.processo.id);
          if (error) throw error;
        }
      } catch (error) {
        alert('Erro ao atualizar processo: ' + (error.message || error))
      }
    }

    return {
      processoId,
      selectedEmpresa,
      numeroContrato,
      valorFinal,
      dataAssinatura,
      observacoes,
      empresas,
      isEditing,
      empresaNome,
      startEdit,
      cancelEdit,
      saveAtualPrestador,
      updateProcesso
    }
  }
}
</script>