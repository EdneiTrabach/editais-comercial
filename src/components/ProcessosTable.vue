<template>
  <div>
    <Table
      :columns="columns"
      :data="data"
      border
      @on-row-click="handleRowClick"
    />
  </div>
</template>

<script>
import EmpresaVencedoraCell from './EmpresaVencedoraCell.vue';

export default {
  name: 'ProcessosTable',
  components: {
    EmpresaVencedoraCell
  },
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      columns: [
        {
          title: 'Empresa Vencedora',
          key: 'empresa_vencedora',
          sortable: true,
          minWidth: 150,
          render: this.renderEmpresaVencedoraCell
        },
        // outras colunas...
      ]
    };
  },
  methods: {
    /**
     * Dispara evento para editar a empresa vencedora
     */
    handleEditarEmpresaVencedora(data) {
      console.log('ProcessosTable: handleEditarEmpresaVencedora chamado com dados:', data);
      this.$emit('editar-empresa-vencedora', data);
    },

    /**
     * Renderiza a célula de empresa vencedora
     */
    renderEmpresaVencedoraCell(h, params) {
      return h(EmpresaVencedoraCell, {
        props: {
          valor: params.row.empresa_vencedora,
          processoId: params.row.id
        },
        on: {
          editar: (data) => {
            console.log('Evento editar capturado com dados:', data);
            this.handleEditarEmpresaVencedora(data);
          }
        }
      });
    },

    /**
     * Manipula o clique na linha
     */
    handleRowClick(row, index) {
      this.$emit('row-click', row, index);
    }
  }
};
</script>

<style scoped>
/* Estilos da tabela */
</style>