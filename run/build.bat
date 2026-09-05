@echo off
setlocal

cd /d "%~dp0.."

python -m pip install -r requirements.txt
if errorlevel 1 exit /b 1

python -m PyInstaller --onefile --name vieXLSX --distpath run --workpath run\build --specpath run --clean src\main.py
if errorlevel 1 exit /b 1

if not exist "run\config.json" copy /Y "src\config.json" "run\config.json" >nul
if not exist "run\todo.xlsx" copy /Y "src\todo.xlsx" "run\todo.xlsx" >nul

echo.
echo Build complete: run\vieXLSX.exe
endlocal