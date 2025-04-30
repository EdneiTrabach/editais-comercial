/**
 * Melhoria de acessibilidade para a lista de processos
 */
document.addEventListener('DOMContentLoaded', function() {
  // Adicionar atributos ARIA para melhorar acessibilidade
  const processosLista = document.querySelectorAll('.processos-lista');
  
  processosLista.forEach(lista => {
    // Adicionar role para a tabela
    const tabela = lista.querySelector('.table-processos');
    if (tabela) {
      tabela.setAttribute('role', 'grid');
      
      const thead = tabela.querySelector('thead');
      if (thead) {
        thead.setAttribute('role', 'rowgroup');
        const headerRow = thead.querySelector('tr');
        if (headerRow) {
          headerRow.setAttribute('role', 'row');
          const headers = headerRow.querySelectorAll('th');
          headers.forEach((header, index) => {
            header.setAttribute('role', 'columnheader');
            header.setAttribute('id', `header-col-${index}`);
          });
        }
      }
      
      const tbody = tabela.querySelector('tbody');
      if (tbody) {
        tbody.setAttribute('role', 'rowgroup');
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, rowIndex) => {
          row.setAttribute('role', 'row');
          row.setAttribute('tabindex', '0'); // Tornando a linha focável por teclado
          
          // Adicionar manipuladores de eventos de teclado para acessibilidade
          row.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              row.click(); // Simular clique ao pressionar Enter ou Espaço
            }
          });
          
          const cells = row.querySelectorAll('td');
          cells.forEach((cell, cellIndex) => {
            cell.setAttribute('role', 'gridcell');
            cell.setAttribute('aria-labelledby', `header-col-${cellIndex}`);
          });
        });
      }
    }
    
    // Remover indicação de rolagem depois que o usuário rolar a tabela
    lista.addEventListener('scroll', function() {
      if (this.scrollLeft > 0 && window.innerWidth <= 768) {
        this.classList.add('scrolled');
        
        // Remover a pseudoclasse after
        const style = document.createElement('style');
        style.textContent = '.processos-lista.scrolled::after { display: none; }';
        document.head.appendChild(style);
      }
    });
  });
  
  // Melhorar interatividade das checkboxes
  const customCheckboxes = document.querySelectorAll('.custom-checkbox');
  customCheckboxes.forEach(checkbox => {
    const input = checkbox.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.checked = !input.checked;
        
        // Disparar evento de change para que o Vue capture a mudança
        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);
      }
    });
  });
});