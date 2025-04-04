import mitt from 'mitt';

// Criar e exportar o emitter global para comunicação entre componentes
const emitter = mitt();

export default emitter;