REM filepath: c:\Users\ednei\Desktop\WORKSPACE\editais-comercial\fix_docling.bat
@echo off
echo === Verificando instalação do Docling ===
echo.

echo Verificando Python...
python --version
if %errorlevel% neq 0 (
    echo Python não encontrado! Verifique sua instalação.
    exit /b 1
)
echo.

echo Verificando ambiente virtual...
if not exist venv\Scripts\activate.bat (
    echo Ambiente virtual não encontrado! Criando...
    python -m venv venv
    call venv\Scripts\activate.bat
) else (
    call venv\Scripts\activate.bat
)
echo.

echo Atualizando pip...
python -m pip install --upgrade pip
echo.

echo Fechando quaisquer processos Python em execução...
taskkill /F /IM python.exe /T
taskkill /F /IM pythonw.exe /T
echo.

echo Esperando 3 segundos para garantir que os processos estejam encerrados...
timeout /t 3 /nobreak >nul
echo.

echo Desinstalando pacotes Docling existentes...
pip uninstall -y docling
pip uninstall -y docling-core
pip uninstall -y docling-ibm-models
pip uninstall -y docling-parse
echo.

echo Limpando cache pip...
pip cache purge
echo.

echo Reinstalando Docling...
pip install docling
echo.

echo Verificando instalação...
python -c "import docling; print(f'Docling versão: {docling.__version__}')"
if %errorlevel% neq 0 (
    echo Falha ao importar Docling. Verifique as mensagens de erro acima.
) else (
    echo Instalação concluída com sucesso!
)
echo.

echo Criando arquivo docling_api_fix.py...
echo from fastapi import FastAPI > docling_api_fix.py
echo app = FastAPI() >> docling_api_fix.py
echo @app.get("/") >> docling_api_fix.py
echo async def root(): >> docling_api_fix.py
echo     return {"message": "API funcionando"} >> docling_api_fix.py
echo.

echo Criando script de diagnóstico...
python -c "with open('diagnostico_docling.py', 'w') as f: f.write('import sys\nimport pkg_resources\n\nprint(\"Python version:\", sys.version)\nprint(\"\\nPacotes instalados:\")\nfor pkg in sorted([f\"{p.key}=={p.version}\" for p in pkg_resources.working_set if \"docling\" in p.key.lower()]):\n    print(f\"  {pkg}\")\n\ntry:\n    import docling\n    print(\"\\nDocling versão:\", getattr(docling, \"__version__\", \"desconhecida\"))\nexcept ImportError as e:\n    print(f\"\\nErro ao importar docling: {e}\")')"
echo.

echo Executando diagnóstico...
python diagnostico_docling.py
echo.

echo Iniciando servidor com o novo arquivo...
echo Para sair pressione CTRL+C
echo.
echo Certifique-se de que o arquivo docling_api_fix.py completo foi criado conforme instruções!
echo.
uvicorn docling_api_fix:app --reload --port 8000