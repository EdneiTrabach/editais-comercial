// scripts/baixarCoordenadas.js
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import https from 'node:https';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// URL base da API do IBGE
const IBGE_API = 'https://servicodados.ibge.gov.br/api/v1';

// Função para fazer requisição HTTP usando https
const fetchJson = async (url) => {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    https.get(url, options, (res) => {
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
    console.log('Iniciando download das coordenadas do ES...');
    
    // Busca dados do ES
    const estados = await fetchJson(`${IBGE_API}/localidades/estados`);
    const es = estados.find(estado => estado.sigla === 'ES');
    
    if (!es) {
      throw new Error('Estado ES não encontrado');
    }

    const coordenadas = {
      "ES": {}
    };

    // Busca municípios do ES
    const municipios = await fetchJson(
      `${IBGE_API}/localidades/estados/${es.id}/municipios`
    );
    console.log(`Encontrados ${municipios.length} municípios no ES`);

    // Para cada município
    for (const municipio of municipios) {
      const query = encodeURIComponent(`${municipio.nome}, ES, Brasil`);
      await delay(1000); // Respeita limite de requisições

      try {
        const geoData = await fetchJson(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
        );

        if (geoData?.[0]) {
          coordenadas.ES[municipio.nome] = {
            latitude: parseFloat(geoData[0].lat),
            longitude: parseFloat(geoData[0].lon)
          };
          process.stdout.write('.');
        }
      } catch (error) {
        console.error(`\nErro ao buscar coordenadas de ${municipio.nome}: ${error.message}`);
        coordenadas.ES[municipio.nome] = {
          latitude: 0,
          longitude: 0
        };
      }
    }

    // Salva resultado em arquivo
    const outputPath = join(__dirname, '../src/data/coordenadasMunicipios.ts');
    const fileContent = `// Arquivo gerado automaticamente
export const coordenadasMunicipais = ${JSON.stringify(coordenadas, null, 2)};`;

    await import('fs/promises').then(fs => 
      fs.writeFile(outputPath, fileContent)
    );
    
    console.log('\n\nArquivo de coordenadas do ES gerado com sucesso!');

  } catch (error) {
    console.error('Erro:', error);
  }
}

// Executa o script
baixarCoordenadas();