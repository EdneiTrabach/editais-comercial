<template>
    <div class="tour-button" v-if="showButton" @click="startTour">
      <slot name="button">
        <button>Iniciar Tour</button>
      </slot>
    </div>
  </template>
  
  <script>
  import Shepherd from 'shepherd.js';
  import 'shepherd.js/dist/css/shepherd.css';
  
  export default {
    name: 'TourGuide',
    props: {
      steps: {
        type: Array,
        required: true
      },
      showButton: {
        type: Boolean,
        default: true
      },
      tourOptions: {
        type: Object,
        default: () => ({})
      }
    },
    data() {
      return {
        tour: null
      };
    },
    created() {
      this.initTour();
    },
    beforeUnmount() {
      if (this.tour) {
        this.tour.cancel();
        this.cleanupTourElements();
      }
      // Remover o listener de teclado
      document.removeEventListener('keyup', this.handleEscKey);
    },
    methods: {
      initTour() {
        const defaultOptions = {
          useModalOverlay: true,
          exitOnEsc: true,
          keyboardNavigation: true,
          defaultStepOptions: {
            cancelIcon: {
              enabled: true
            },
            classes: 'shepherd-theme-custom',
            scrollTo: { behavior: 'smooth', block: 'center' },
            modalOverlayOpeningPadding: 10,
            popperOptions: {
              modifiers: [{ name: 'offset', options: { offset: [0, 16] } }]
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
          }
        };
  
        this.tour = new Shepherd.Tour({
          ...defaultOptions,
          ...this.tourOptions
        });
  
        // Adiciona os passos ao tour
        this.steps.forEach(step => {
          this.tour.addStep(step);
        });
  
        // Eventos
        this.tour.on('complete', () => {
          this.$emit('complete');
          this.cleanupTourElements();
        });
        
        this.tour.on('cancel', () => {
          this.$emit('cancel');
          this.cleanupTourElements();
        });
        
        this.tour.on('start', () => this.$emit('start'));
        this.tour.on('show', () => this.$emit('show'));
        
        // Adicionar evento para ESC para limpar elementos
        document.addEventListener('keyup', this.handleEscKey);
      },
      
      handleEscKey(e) {
        if (e.key === 'Escape' && this.tour) {
          this.tour.cancel();
          this.cleanupTourElements();
        }
      },
      
      cleanupTourElements() {
        console.log('Cleaning up tour elements');
        // Remover overlay e elementos de tour que possam permanecer no DOM
        const overlays = document.querySelectorAll('.shepherd-modal-overlay-container');
        overlays.forEach(overlay => overlay.remove());
        
        const elements = document.querySelectorAll('.shepherd-element');
        elements.forEach(element => element.remove());
      },
      
      startTour() {
        console.log('Starting tour...');
        this.cleanupTourElements(); // Limpa qualquer tour anterior
        this.tour.start();
      },
      
      complete() {
        this.tour.complete();
        this.cleanupTourElements();
        
        // Emitir o evento sem exibir notificação aqui
        // A notificação será exibida no componente pai
        this.$emit('complete');
      }
    }
  }
  </script>
  
  <style scoped>
  /* Estilos personalizados para o Shepherd.js */
.shepherd-theme-custom {
  --shepherd-bg: #fff;
  --shepherd-text: #333;
  --shepherd-border: #ddd;
  --shepherd-button-primary-bg: #1976d2;
  --shepherd-button-primary-text: #fff;
  --shepherd-button-secondary-bg: #f5f5f5;
  --shepherd-button-secondary-text: #333;
}

.shepherd-button {
  border-radius: 4px;
  padding: 8px 16px;
  margin-right: 8px;
  font-weight: 500;
}

.shepherd-button-primary {
  background-color: var(--shepherd-button-primary-bg);
  color: var(--shepherd-button-primary-text);
}

.shepherd-button-secondary {
  background-color: var(--shepherd-button-secondary-bg);
  color: var(--shepherd-button-secondary-text);
}


  </style>