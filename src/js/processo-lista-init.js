/**
 * Inicialização e integração do componente ProcessoLista
 */
document.addEventListener('DOMContentLoaded', function() {
  // Configuração da tabela de processos
  const processosListas = document.querySelectorAll('.processos-lista');
  
  processosListas.forEach(lista => {
    // Adicionar detectores de rolagem horizontal
    lista.addEventListener('scroll', function() {
      if (this.scrollLeft > 0) {
        this.classList.add('scrolled');
      }
    });
    
    // Melhorar acessibilidade
    const tabela = lista.querySelector('.table-processos');
    if (tabela) {
      tabela.setAttribute('role', 'grid');
      tabela.setAttribute('aria-label', 'Lista de processos');
      
      const linhas = tabela.querySelectorAll('tbody tr');
      linhas.forEach(linha => {
        linha.setAttribute('tabindex', '0');
        linha.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            linha.click();
          }
        });
      });
    }
  });
  
  // Configuração dos filtros
  const filtrosOptions = document.querySelectorAll('.filter-options');
  filtrosOptions.forEach(filtro => {
    const checkbox = filtro.querySelector('input[type="checkbox"]');
    if (checkbox) {
      // Restaurar estado do filtro do localStorage
      const savedState = localStorage.getItem('showOnlyInAnalysis');
      if (savedState) {
        checkbox.checked = savedState === 'true';
        // Disparar evento para aplicar o filtro salvo
        checkbox.dispatchEvent(new Event('change'));
      }
      
      // Salvar estado no localStorage quando alterado
      checkbox.addEventListener('change', () => {
        localStorage.setItem('showOnlyInAnalysis', checkbox.checked);
      });
    }
  });
});