<template>
  <div class="modal-cfg-usuarios">
    <div class="modal-content-cfg-usuarios">
      <h2 class="modal-title-cfg-usuarios">Adicionar Novo Usuário</h2>
      <form @submit.prevent="$emit('add-user')" class="form-cfg-usuarios">
        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Email</label>
          <input 
            v-model="newUser.email" 
            type="email" 
            required 
            class="input-cfg-usuarios"
          />
        </div>
        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Senha</label>
          <input 
            v-model="newUser.password" 
            type="password" 
            required 
            minlength="6"
            class="input-cfg-usuarios"
          />
        </div>
        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Nome</label>
          <input 
            v-model="newUser.nome" 
            type="text" 
            required 
            class="input-cfg-usuarios"
          />
        </div>
        <div class="form-group-cfg-usuarios">
          <label class="label-cfg-usuarios">Função</label>
          <select v-model="newUser.role" class="select-cfg-usuarios">
            <option value="user" class="option-cfg-usuarios">Usuário</option>
            <option value="admin" class="option-cfg-usuarios">Administrador</option>
          </select>
        </div>
        <div class="modal-actions-cfg-usuarios">
          <button type="button" @click="$emit('close')" class="btn-cancel-cfg-usuarios">
            Cancelar
          </button>
          <button type="submit" class="btn-confirm-cfg-usuarios" :disabled="loading">
            {{ loading ? 'Criando...' : 'Criar Usuário' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AddUserModal',
  props: {
    newUser: Object,
    loading: Boolean
  },
  emits: ['close', 'add-user']
}
</script>

<style scoped>
/* Estilos específicos para o modal */
.label-cfg-usuarios {
  font-weight: 500;
  font-size: 0.95rem;
  color: #374151;
  margin-bottom: 0.25rem;
}

[data-theme="dark"] .label-cfg-usuarios {
  color: #e5e7eb;
}

/* Ajuste para não sobrescrever estilos globais */
/* O restante dos estilos já está definido no CSS global */
</style>
