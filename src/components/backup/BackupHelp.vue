<template>
  <div class="backup-help">
    <h3>Sobre o Backup em ZIP</h3>
    
    <div class="help-section">
      <h4>Conteúdo do Arquivo</h4>
      <p>Cada arquivo ZIP de backup contém:</p>
      
      <ul>
        <li><strong>metadata/</strong> - Pasta com metadados do backup em formato SQL</li>
        <li><strong>sql_data/</strong> - Pasta com scripts SQL para cada tabela do banco de dados</li>
        <li><strong>restaurar_backup.sql</strong> - Script principal que importa todos os outros scripts em ordem</li>
      </ul>
    </div>
    
    <div class="help-section">
      <h4>Como Restaurar</h4>
      <p>Para restaurar dados de um backup:</p>
      
      <ol>
        <li>Extraia o arquivo ZIP para uma pasta</li>
        <li>Execute o arquivo <code>restaurar_backup.sql</code> usando psql ou outra ferramenta SQL</li>
        <li>Para restauração parcial, execute scripts SQL individuais da pasta <code>sql_data</code></li>
      </ol>
      
      <div class="alert alert-warning">
        <strong>Importante:</strong> A restauração sobrescreverá os dados existentes. Faça um backup do estado atual antes de restaurar.
      </div>
    </div>
    
    <div class="help-section">
      <h4>Formato SQL</h4>
      <p>Cada arquivo SQL contém instruções INSERT para uma tabela específica do banco de dados, facilitando importação direta ou seletiva no banco de dados PostgreSQL.</p>
      
      <pre class="sql-example">
INSERT INTO "public"."tabela" ("coluna1", "coluna2", "coluna3") VALUES
('valor1', 'valor2', 123),
('valor3', 'valor4', 456);
      </pre>
    </div>
    
    <div class="help-section">
      <h4>Tabelas Incluídas</h4>
      <div class="included-tables">
        <div class="table-category">
          <h5>Usuários e Perfis</h5>
          <ul>
            <li>profiles</li>
          </ul>
        </div>
        
        <div class="table-category">
          <h5>Empresas</h5>
          <ul>
            <li>empresas</li>
            <li>representantes</li>
            <li>plataformas</li>
          </ul>
        </div>
        
        <div class="table-category">
          <h5>Dados do Negócio</h5>
          <ul>
            <li>editais</li>
            <li>responsaveis_processos</li>
            <li>sistemas</li>
            <li>setores</li>
          </ul>
        </div>
        
        <div class="table-category">
          <h5>Sistema</h5>
          <ul>
            <li>configuracoes</li>
            <li>system_config</li>
            <li>system_updates</li>
            <li>notifications</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BackupHelp'
}
</script>

<style scoped>
.backup-help {
  margin-top: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #193155;
}

.backup-help h3 {
  margin-top: 0;
  color: #193155;
  font-size: 1.2rem;
}

.help-section {
  margin-bottom: 1.5rem;
}

.help-section h4 {
  color: #193155;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.help-section p {
  margin-bottom: 1rem;
  color: #555;
}

.help-section ol, 
.help-section ul {
  padding-left: 20px;
  color: #555;
}

.help-section li {
  margin-bottom: 0.5rem;
}

.alert {
  padding: 12px;
  border-radius: 4px;
  margin-top: 1rem;
}

.alert-warning {
  background-color: #FFF3E0;
  border-left: 4px solid #FF9800;
  color: #E65100;
}

.included-tables {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.table-category {
  flex: 1;
  min-width: 200px;
}

.table-category h5 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.table-category ul {
  list-style-type: disc;
  margin: 0;
  padding-left: 20px;
}

.table-category li {
  font-family: monospace;
  margin-bottom: 0.2rem;
}

@media (max-width: 768px) {
  .included-tables {
    flex-direction: column;
  }
  
  .table-category {
    min-width: 100%;
  }
}

.sql-example {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  font-family: monospace;
  font-size: 0.85rem;
  color: #333;
  white-space: pre-wrap;
  margin: 10px 0;
  overflow-x: auto;
}
</style>
