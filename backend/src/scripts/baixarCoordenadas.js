// scripts/baixarCoordenadas.js

const fs = require('fs');
const path = require('path');
const https = require('https');

// URL base da API do IBGE
const IBGE_API = 'https://servicodados.ibge.gov.br/api/v1';

// Função para fazer requisição HTTP
const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

// Função para aguardar entre requisições
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function baixarCoordenadas() {
  try {
    console.log('Iniciando download das coordenadas...');
    
    // 1. Busca todos os estados
    const estados = await fetchJson(`${IBGE_API}/localidades/estados`);
    console.log(`Encontrados ${estados.length} estados`);

    const coordenadas = {};

    // 2. Para cada estado
    for (const estado of estados) {
      console.log(`\nProcessando ${estado.sigla}...`);
      coordenadas[estado.sigla] = {};

      // 3. Busca municípios do estado
      const municipios = await fetchJson(
        `${IBGE_API}/localidades/estados/${estado.id}/municipios`
      );
      console.log(`Encontrados ${municipios.length} municípios`);

      // 4. Para cada município
      for (const municipio of municipios) {
        // Busca coordenadas usando uma API de geocoding gratuita
        const query = encodeURIComponent(`${municipio.nome}, ${estado.sigla}, Brasil`);
        await delay(1000); // Respeita limite de requisições

        try {
          const geoData = await fetchJson(
            `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
          );

          if (geoData?.[0]) {
            coordenadas[estado.sigla][municipio.nome] = {
              latitude: parseFloat(geoData[0].lat),
              longitude: parseFloat(geoData[0].lon)
            };
            process.stdout.write('.');
          }
        } catch (error) {
          console.error(`\nErro ao buscar coordenadas de ${municipio.nome}: ${error.message}`);
          // Adiciona coordenadas vazias para não quebrar o processo
          coordenadas[estado.sigla][municipio.nome] = {
            latitude: 0,
            longitude: 0
          };
        }
      }
    }

    // 5. Salva resultado em arquivo
    const outputPath = path.join(__dirname, '../src/data/coordenadasMunicipios.ts');
    const fileContent = `// Arquivo gerado automaticamente
export const coordenadasMunicipais = ${JSON.stringify(coordenadas, null, 2)};`;

    fs.writeFileSync(outputPath, fileContent);
    console.log('\n\nArquivo de coordenadas gerado com sucesso!');

  } catch (error) {
    console.error('Erro:', error);
  }
}

// Executa o script
baixarCoordenadas();