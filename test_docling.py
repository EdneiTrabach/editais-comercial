import sys
import pkg_resources

print("Verificação do ambiente Python")
print("-----------------------------")
print(f"Python versão: {sys.version}")
print(f"Executável: {sys.executable}")

print("\nPacotes Docling instalados:")
print("-----------------------------")
docling_packages = [pkg for pkg in pkg_resources.working_set if "docling" in pkg.key.lower()]
if docling_packages:
    for pkg in sorted(docling_packages, key=lambda p: p.key):
        print(f"  {pkg.key} == {pkg.version}")
else:
    print("  Nenhum pacote Docling encontrado!")

print("\nTentando importar Docling:")
print("-----------------------------")
try:
    import docling
    print(f"  ✅ Docling importado com sucesso (versão: {getattr(docling, '__version__', 'desconhecida')})")
    
    from docling.document_converter import DocumentConverter
    print("  ✅ DocumentConverter importado com sucesso")
    
    from docling.datamodel.base_models import InputFormat
    print("  ✅ InputFormat importado com sucesso")
    
    from docling.datamodel.pipeline_options import PdfPipelineOptions
    print("  ✅ PdfPipelineOptions importado com sucesso")
    
    print("\nDocling parece estar instalado corretamente!")
except Exception as e:
    print(f"  ❌ Erro ao importar: {e}")
    print(f"\nDocling não está configurado corretamente!")