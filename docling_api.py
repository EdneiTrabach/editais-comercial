from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import os
import logging
import sys
import traceback
import json
import subprocess
import shutil
from pathlib import Path
import io

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

# Verificar se o pytesseract está disponível
TESSERACT_AVAILABLE = False
try:
    import pytesseract
    from PIL import Image
    
    # Verificar se o Tesseract está instalado
    tesseract_cmd = shutil.which('tesseract')
    if tesseract_cmd:
        pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        TESSERACT_AVAILABLE = True
        logger.info(f"✅ Tesseract OCR encontrado: {tesseract_cmd}")
    else:
        # Tentar definir o caminho padrão para Windows
        default_win_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        if os.path.exists(default_win_path):
            pytesseract.pytesseract.tesseract_cmd = default_win_path
            TESSERACT_AVAILABLE = True
            logger.info(f"✅ Tesseract OCR encontrado no caminho padrão: {default_win_path}")
        else:
            logger.warning("⚠️ Tesseract OCR não encontrado no sistema")
except ImportError:
    logger.warning("⚠️ pytesseract não está instalado")
except Exception as e:
    logger.warning(f"⚠️ Erro ao verificar pytesseract: {str(e)}")

# Verificar se o pdf2image está disponível (para converter PDF para imagens)
PDF2IMAGE_AVAILABLE = False
try:
    import pdf2image
    PDF2IMAGE_AVAILABLE = True
    logger.info("✅ pdf2image importado com sucesso")
    
    # Verificar se o poppler está instalado (necessário para pdf2image)
    if shutil.which('pdftoppm') or os.path.exists(r'C:\Program Files\poppler-0.68.0\bin\pdftoppm.exe'):
        logger.info("✅ Poppler encontrado (necessário para pdf2image)")
    else:
        logger.warning("⚠️ Poppler não encontrado, pdf2image pode não funcionar corretamente")
except ImportError:
    logger.warning("⚠️ pdf2image não está instalado")
except Exception as e:
    logger.warning(f"⚠️ Erro ao verificar pdf2image: {str(e)}")

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
    return {
        "message": "Docling API está funcionando", 
        "docling_available": DOCLING_AVAILABLE,
        "tesseract_available": TESSERACT_AVAILABLE,
        "pdf2image_available": PDF2IMAGE_AVAILABLE
    }

@app.get("/health")
async def health_check():
    """Endpoint para verificar o status da API e do Docling"""
    return {
        "status": "ok", 
        "docling_available": DOCLING_AVAILABLE, 
        "tesseract_available": TESSERACT_AVAILABLE,
        "pdf2image_available": PDF2IMAGE_AVAILABLE,
        "version": "1.0.0"
    }

@app.get("/debug")
async def debug():
    """Endpoint para diagnóstico detalhado"""
    tools_info = {}
    
    # Verificar Tesseract
    if TESSERACT_AVAILABLE:
        try:
            version_output = subprocess.check_output(['tesseract', '--version'], stderr=subprocess.STDOUT, text=True)
            tools_info["tesseract"] = version_output.split('\n')[0]
        except:
            tools_info["tesseract"] = "Instalado, mas não foi possível obter a versão"
    else:
        tools_info["tesseract"] = "Não instalado ou não encontrado"
    
    # Verificar poppler para pdf2image
    if PDF2IMAGE_AVAILABLE:
        try:
            tools_info["pdf2image"] = "Instalado"
            if shutil.which('pdftoppm'):
                tools_info["poppler"] = "Encontrado"
            else:
                tools_info["poppler"] = "Não encontrado no PATH"
        except:
            tools_info["pdf2image"] = "Status desconhecido"
    else:
        tools_info["pdf2image"] = "Não instalado"
    
    return {
        "docling_available": DOCLING_AVAILABLE,
        "python_version": sys.version,
        "tools": tools_info,
        "modules_loaded": {
            "docling": "Loaded" if DOCLING_AVAILABLE else "Not loaded",
            "docling.document_converter": "DocumentConverter available" if DOCLING_AVAILABLE else "Not available",
            "pytesseract": "Loaded" if TESSERACT_AVAILABLE else "Not loaded",
            "pdf2image": "Loaded" if PDF2IMAGE_AVAILABLE else "Not loaded"
        }
    }

def extract_text_using_tesseract(pdf_path):
    """Extrai texto de um PDF usando tesseract via pdf2image"""
    if not TESSERACT_AVAILABLE or not PDF2IMAGE_AVAILABLE:
        logger.warning("Tesseract ou pdf2image não disponíveis para extração alternativa")
        return None
    
    try:
        logger.info(f"Tentando extrair texto com pdf2image e tesseract de: {pdf_path}")
        # Converter PDF para imagens
        images = pdf2image.convert_from_path(pdf_path)
        logger.info(f"PDF convertido em {len(images)} imagens")
        
        # Extrair texto de cada imagem
        text_content = ""
        for i, img in enumerate(images):
            # Usar pytesseract para extrair texto
            page_text = pytesseract.image_to_string(img, lang='por')
            text_content += f"--- Página {i+1} (OCR) ---\n{page_text}\n\n"
        
        logger.info(f"Texto extraído com Tesseract: {len(text_content)} caracteres")
        return text_content
    except Exception as e:
        logger.error(f"Erro ao extrair texto com Tesseract: {str(e)}")
        return None

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
    
    tmp_path = None
    
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
            
            # Extrair texto usando Docling
            text_content = ""
            success_docling = False
            
            if DOCLING_AVAILABLE:
                try:
                    # Importar manualmente os módulos necessários dentro do bloco try
                    from docling.document_converter import DocumentConverter
                    from docling.datamodel.base_models import InputFormat
                    from docling.datamodel.pipeline_options import PdfPipelineOptions
                    from docling.document_converter import PdfFormatOption
                    
                    # Configurar opções do PDF com OCR 
                    logger.info("Configurando opções para processamento PDF com OCR")
                    pipeline_options = PdfPipelineOptions()
                    pipeline_options.do_ocr = True     # Ativar OCR
                    
                    # Verificar se o atributo existe antes de usá-lo
                    try:
                        # Em algumas versões mais recentes pode existir
                        if hasattr(pipeline_options, 'force_ocr'):
                            pipeline_options.force_ocr = True
                    except:
                        logger.info("Atributo force_ocr não disponível nesta versão do Docling")
                    
                    # Criar o conversor com as configurações de OCR
                    logger.info("Criando conversor de documentos")
                    converter = DocumentConverter(
                        format_options={
                            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
                        }
                    )
                    
                    # Processar o documento
                    logger.info("Iniciando conversão do documento com OCR via Docling")
                    result = converter.convert(tmp_path)
                    doc = result.document
                    logger.info("Documento convertido com sucesso")
                    
                    # Melhorar a extração de texto usando todos os métodos disponíveis
                    # Método 1: Extrair texto das páginas
                    if hasattr(doc, "pages"):
                        logger.info(f"Documento tem {len(doc.pages)} páginas")
                        for i, page in enumerate(doc.pages):
                            page_text = ""
                            
                            # Método 1.1: Extrair de text_blocks
                            if hasattr(page, "text_blocks") and page.text_blocks:
                                for block in page.text_blocks:
                                    if hasattr(block, "text") and block.text:
                                        page_text += block.text + "\n"
                            
                            # Método 1.2: Extrair de raw_text se disponível
                            if hasattr(page, "raw_text") and page.raw_text:
                                if not page_text:  # Se não temos texto dos blocos, usar raw_text
                                    page_text = page.raw_text
                            
                            # Adicionar texto da página ao conteúdo total
                            if page_text:
                                text_content += f"--- Página {i+1} ---\n{page_text}\n\n"
                            else:
                                logger.warning(f"Nenhum texto encontrado na página {i+1}")
                    
                    # Método 2: Tentar acessar texto diretamente do documento
                    if not text_content and hasattr(doc, "text"):
                        text_content = doc.text
                        logger.info("Usando texto do documento inteiro")
                    
                    if text_content and text_content.strip():
                        logger.info(f"Texto extraído com Docling: {len(text_content)} caracteres")
                        success_docling = True
                    else:
                        logger.warning("Docling não conseguiu extrair texto")
                
                except Exception as docling_error:
                    logger.error(f"Erro no processamento com Docling: {str(docling_error)}")
                    logger.error(traceback.format_exc())
            
            # Se Docling falhou ou não extraiu texto, tentar com Tesseract
            if not success_docling and suffix.lower() == '.pdf':
                logger.info("Tentando extração alternativa com Tesseract")
                tesseract_text = extract_text_using_tesseract(tmp_path)
                if tesseract_text:
                    text_content = tesseract_text
                    logger.info(f"Texto extraído com Tesseract: {len(text_content)} caracteres")
            
            # Verificar se realmente extraímos texto
            if not text_content or text_content.strip() == "":
                logger.warning("Nenhum texto foi extraído do documento por nenhum método")
                text_content = "MEU NOME É EDNEI"  # Texto fixo para teste (substitua por mensagem apropriada)
            else:
                logger.info(f"Texto extraído com sucesso: {len(text_content)} caracteres")
            
            # Criar uma resposta simplificada
            response_data = {
                "success": True,
                "metadata": {
                    "filename": file.filename,
                    "pages": 1,  # Valor padrão
                    "file_type": suffix.lstrip('.').upper() if suffix else "PDF"
                },
                "content": {
                    "text": text_content,
                    "tables": [],  # Incluir lista vazia para tabelas
                    "images": []   # Incluir lista vazia para imagens
                }
            }
            
            # Se temos informação de páginas do Docling, atualizar
            if DOCLING_AVAILABLE and 'doc' in locals() and hasattr(doc, "pages"):
                response_data["metadata"]["pages"] = len(doc.pages)
            
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
            if tmp_path and os.path.exists(tmp_path):
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