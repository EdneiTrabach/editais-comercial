/**
 * Inicializa componentes e recursos para a tela de análises
 */
document.addEventListener('DOMContentLoaded', function() {
  // Importar scripts de acessibilidade
  import('./filtros-accessibility.js');
  
  // Detectar tema atual para aplicação correta das cores
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  document.querySelectorAll('[data-theme-sensitive]').forEach(el => {
    el.setAttribute('data-current-theme', currentTheme);
  });
  
  // Observador de mudanças de tema
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-theme') {
        const newTheme = document.documentElement.getAttribute('data-theme') || 'light';
        document.querySelectorAll('[data-theme-sensitive]').forEach(el => {
          el.setAttribute('data-current-theme', newTheme);
        });
      }
    });
  });
  
  observer.observe(document.documentElement, { attributes: true });
});