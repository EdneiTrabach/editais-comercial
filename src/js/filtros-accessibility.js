/**
 * Melhora a acessibilidade do componente de filtros
 */
document.addEventListener('DOMContentLoaded', function() {
  // Adiciona atributos ARIA para melhor acessibilidade nos filtros
  const filtrosContainers = document.querySelectorAll('.filtros-container');
  
  filtrosContainers.forEach((container, index) => {
    const toggleBtn = container.querySelector('.btn-toggle-filtros');
    const content = container.querySelector('.filtros-content');
    const headingText = container.querySelector('.filtros-header h3').textContent;
    
    // Identificadores únicos
    const contentId = `filtros-content-${index}`;
    
    // Configurar ARIA para o botão toggle
    if (toggleBtn && content) {
      content.id = contentId;
      
      toggleBtn.setAttribute('aria-expanded', container.classList.contains('expanded') ? 'true' : 'false');
      toggleBtn.setAttribute('aria-controls', contentId);
      toggleBtn.setAttribute('aria-label', `${container.classList.contains('expanded') ? 'Ocultar' : 'Mostrar'} filtros de ${headingText}`);
      
      // Adicionar evento de acessibilidade ao botão
      toggleBtn.addEventListener('click', function() {
        const isExpanded = container.classList.contains('expanded');
        this.setAttribute('aria-expanded', !isExpanded ? 'true' : 'false');
        this.setAttribute('aria-label', `${!isExpanded ? 'Ocultar' : 'Mostrar'} filtros de ${headingText}`);
      });
    }
    
    // Melhorar acessibilidade dos inputs
    container.querySelectorAll('.filtro-item').forEach(item => {
      const label = item.querySelector('label');
      const input = item.querySelector('input, select');
      
      if (label && input) {
        if (!input.id) {
          input.id = `${label.textContent.toLowerCase().replace(/\s+/g, '-')}-${index}`;
        }
        label.setAttribute('for', input.id);
      }
    });
    
    // Adicionar atalho de teclado para aplicar filtros (Enter)
    container.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const applyBtn = container.querySelector('.btn-aplicar');
          if (applyBtn) {
            applyBtn.click();
          }
        }
      });
    });
  });
  
  // Adicionar suporte para usuários de teclado
  document.querySelectorAll('.filtros-container .btn-toggle-filtros').forEach(btn => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
    
    // Garantir que o botão seja focalizável
    if (!btn.hasAttribute('tabindex')) {
      btn.setAttribute('tabindex', '0');
    }
  });
});