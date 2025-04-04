<template>
  <div 
    class="sistemas-implantacao-coluna" 
    @click="abrirSeletorSistemas"
    :class="{ 'tem-sistemas': totalSistemas > 0 }"
  >
    <div class="sistemas-badge" v-if="totalSistemas > 0">
      {{ totalSistemas }}
    </div>
    <i class="fas fa-server"></i>
  </div>
</template>

<script>
export default {
  name: 'SistemasImplantacaoColuna',
  props: {
    processo: {
      type: Object,
      required: true
    }
  },
  computed: {
    totalSistemas() {
      if (!this.processo.sistemas_implantacao) return 0;
      
      try {
        const sistemas = JSON.parse(this.processo.sistemas_implantacao);
        return sistemas.filter(s => s.selecionado && !s.implantado).length;
      } catch (e) {
        console.error('Erro ao processar sistemas a implantar:', e);
        return 0;
      }
    }
  },
  methods: {
    abrirSeletorSistemas(event) {
      // Emite evento para o componente pai com o processo e o evento do mouse
      this.$emit('evento', {
        evento: 'abrir-seletor-sistemas',
        dados: {
          processo: this.processo,
          event: event
        }
      });
    }
  }
}
</script>

<style scoped>
.sistemas-implantacao-coluna {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin: 0 auto;
  color: #999;
  transition: all 0.2s ease;
}

.sistemas-implantacao-coluna:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: scale(1.1);
}

.sistemas-implantacao-coluna.tem-sistemas {
  color: #1976D2;
}

.sistemas-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #F44336;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  padding: 0 3px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
</style>