import { ref } from 'vue';

export default function useTourGuide() {
  const tourSteps = ref([]);
  
  const configureTour = (steps, options = {}) => {
    tourSteps.value = steps.map((step, index) => ({
      id: `step-${index + 1}`,
      ...step,
      buttons: step.buttons || [
        {
          text: 'Voltar',
          action: function() { this.back(); },
          classes: 'shepherd-button-secondary',
          disabled: index === 0
        },
        {
          text: index === steps.length - 1 ? 'Concluir' : 'Próximo',
          action: function() { this.next(); },
          classes: 'shepherd-button-primary'
        }
      ]
    }));
    
    return {
      steps: tourSteps.value,
      tourOptions: options
    };
  };

  return {
    tourSteps,
    configureTour
  };
}