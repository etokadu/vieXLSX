@echo off
setlocal enabledelayedexpansion
title vieXLSX - Build Windows EXE
cd /d "%~dp0.."

echo ============================================
echo   vieXLSX - Windows EXE build
echo ============================================
echo.

set PYTHON_CMD=python
if exist ".venv\Scripts\python.exe" set PYTHON_CMD=.venv\Scripts\python.exe

%PYTHON_CMD% --version >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Khong tim thay Python. Cai Python 3.8+ hoac tao .venv truoc.
  exit /b 1
)

echo [1/4] Cai dat dependencies...
%PYTHON_CMD% -m pip install -r requirements.txt
if errorlevel 1 (
  echo [ERROR] Cai dependencies that bai.
  exit /b 1
)

echo.
echo [2/4] Don build cu (run\build, run\dist)...
if exist "run\build" rd /s /q "run\build"
if exist "run\__pycache__" rd /s /q "run\__pycache__"

echo.
echo [3/4] Build EXE bang PyInstaller...
%PYTHON_CMD% -m PyInstaller --distpath run --workpath run\build --clean run\vieXLSX.spec
if errorlevel 1 (
  echo [ERROR] Build that bai. Xem log ben tren.
  exit /b 1
)

echo.
echo [4/4] Sao chep du lieu mac dinh...
if not exist "run\config.json" copy /Y "src\config.json" "run\config.json" >nul
if not exist "run\todo.xlsx" copy /Y "src\todo.xlsx" "run\todo.xlsx" >nul

echo.
echo ============================================
echo   Build hoan tat: run\vieXLSX.exe
echo   Giu config.json va todo.xlsx cung thu muc voi EXE.
echo ============================================
endlocal
