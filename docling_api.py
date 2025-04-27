from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import os
import logging
import sys
import traceback
import json

# Configurar logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("docling_api")

# Verificar se o Docling está disponível
DOCLING_AVAILABLE = False
try:
    import docling
    from docling.document_converter import DocumentConverter
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions
    from docling.document_converter import PdfFormatOption
    
    DOCLING_AVAILABLE = True
    logger.info(f"✅ Docling importado com sucesso - versão: {getattr(docling, '__version__', 'desconhecida')}")
except ImportError as e:
    logger.error(f"❌ Erro ao importar Docling: {str(e)}")
except Exception as e:
    logger.error(f"❌ Erro inesperado ao importar Docling: {str(e)}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Endpoint raiz para verificar se a API está rodando"""
    return {"message": "Docling API está funcionando", "docling_available": DOCLING_AVAILABLE}

@app.get("/health")
async def health_check():
    """Endpoint para verificar o status da API e do Docling"""
    return {"status": "ok", "docling_available": DOCLING_AVAILABLE, "version": "1.0.0"}

@app.post("/process")
async def process_document(file: UploadFile = File(...)):
    """Endpoint para processar documentos"""
    
    # Verificar se o Docling está disponível
    if not DOCLING_AVAILABLE:
        logger.error("Tentativa de uso do Docling, mas a biblioteca não está disponível")
        return JSONResponse(
            status_code=500,
            content={"error": "Biblioteca docling não está disponível. Verifique a instalação."}
        )
    
    try:
        # Salvar o arquivo temporariamente
        suffix = os.path.splitext(file.filename)[1] if file.filename else ".pdf"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        logger.info(f"Arquivo salvo temporariamente: {tmp_path}")
        logger.info(f"Tamanho do arquivo: {len(content)} bytes")

        try:
            # Log dos dados de entrada
            logger.info(f"Processando arquivo: {file.filename}, tipo: {file.content_type}")
            
            # Verificando se o arquivo existe
            if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
                raise ValueError(f"Arquivo temporário não existe ou está vazio: {tmp_path}")
                
            # Importar manualmente os módulos necessários dentro do bloco try
            # (isso é redundante, mas garantimos que não haverá problemas com a importação)
            from docling.document_converter import DocumentConverter
            from docling.datamodel.base_models import InputFormat
            from docling.datamodel.pipeline_options import PdfPipelineOptions
            from docling.document_converter import PdfFormatOption
                
            # Configurar opções do PDF
            logger.info("Configurando opções para processamento PDF")
            pipeline_options = PdfPipelineOptions()
            pipeline_options.do_ocr = True  # Ativar OCR
                
            # Configurar o DocumentConverter
            logger.info("Criando conversor de documentos")
            converter = DocumentConverter(
                format_options={
                    InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
                }
            )
            
            # Processar o documento
            logger.info("Iniciando conversão do documento")
            result = converter.convert(tmp_path)
            doc = result.document
            logger.info("Documento convertido com sucesso")
            
            # Extrair texto para resposta simplificada
            text_content = ""
            if hasattr(doc, "pages"):
                for page in doc.pages:
                    if hasattr(page, "text_blocks"):
                        for block in page.text_blocks:
                            if hasattr(block, "text") and block.text:
                                text_content += block.text + "\n"
            
            # Criar uma resposta mais simples e robusta
            response_data = {
                "success": True,
                "metadata": {
                    "filename": file.filename,
                    "pages": len(doc.pages) if hasattr(doc, "pages") else 0
                },
                "content": {
                    "text": text_content or "Sem texto extraído"
                }
            }
            
            logger.info("Retornando resposta simplificada bem-sucedida")
            return JSONResponse(content=response_data)
            
        except Exception as e:
            error_details = traceback.format_exc()
            logger.error(f"Erro ao processar documento: {str(e)}")
            logger.error(f"Detalhes do erro: {error_details}")
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": f"Erro ao processar documento: {str(e)}",
                    "details": error_details
                }
            )
        finally:
            # Garantir que o arquivo temporário seja removido
            if os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                    logger.info(f"Arquivo temporário removido: {tmp_path}")
                except Exception as e:
                    logger.warning(f"Erro ao remover arquivo temporário: {str(e)}")
    
    except Exception as outer_e:
        logger.error(f"Erro ao salvar arquivo temporário: {str(outer_e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Erro ao processar upload: {str(outer_e)}"}
        )