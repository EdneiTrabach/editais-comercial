<template>
  <div class="agendamento-info">
    <h3>Como Funciona o Agendamento</h3>
    
    <div class="info-section">
      <h4>Agendamento Automático</h4>
      <p>O agendamento funciona de duas formas:</p>
      
      <ol>
        <li>
          <strong>No Navegador:</strong> Quando você estiver com a página de backups aberta no horário agendado, 
          o backup será iniciado automaticamente. Esta é uma funcionalidade baseada no navegador.
        </li>
        <li>
          <strong>Servidor (Em breve):</strong> Uma função que executará os backups automaticamente no servidor,
          mesmo quando você não estiver usando o sistema.
        </li>
      </ol>
    </div>
    
    <div class="info-section">
      <h4>Importante:</h4>
      <ul>
        <li>Verifique se as tabelas estão corretamente criadas no banco de dados</li>
        <li>Para garantir que os backups sejam executados, mantenha a página de backups aberta no horário agendado</li>
        <li>Um backup automático só será executado uma vez por dia</li>
      </ul>
    </div>
    
    <div class="tip-section">
      <div class="tip-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      </div>
      <div class="tip-content">
        <strong>Dica:</strong> Para verificar se o agendamento está funcionando, configure o horário para 
        alguns minutos após o horário atual e mantenha esta página aberta.
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AgendamentoInfo'
}
</script>

<style scoped>
.agendamento-info {
  margin-top: 20px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1565C0;
}

.agendamento-info h3 {
  margin-top: 0;
  color: #1565C0;
  font-size: 1.2rem;
}

.info-section {
  margin-bottom: 1.5rem;
}

.info-section h4 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.info-section p {
  margin-bottom: 1rem;
  color: #555;
}

.info-section ol, 
.info-section ul {
  padding-left: 20px;
  color: #555;
}

.info-section li {
  margin-bottom: 0.5rem;
}

.tip-section {
  display: flex;
  background-color: #e3f2fd;
  padding: 12px;
  border-radius: 4px;
  margin-top: 1rem;
}

.tip-icon {
  color: #1565C0;
  margin-right: 10px;
  flex-shrink: 0;
}

.tip-content {
  color: #333;
  line-height: 1.4;
}
</style>
