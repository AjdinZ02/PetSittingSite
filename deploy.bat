@echo off
REM Skripta za brz deploy na Windows

echo 🚀 Priprema za deploy...

REM Proveri da li postoji Git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git nije instaliran. Preuzmi sa: https://git-scm.com
    pause
    exit /b 1
)

REM Ako nije Git repo, inicijalizuj
if not exist ".git" (
    echo 📦 Inicijalizacija Git repozitorijuma...
    git init
    git add .
    git commit -m "Initial commit for deployment"
    echo ✅ Git repo kreiran!
    echo.
    echo Sledeći koraci:
    echo 1. Kreiraj GitHub repozitorijum na https://github.com/new
    echo 2. Pokreni: git remote add origin https://github.com/TVOJE-IME/NAZIV-REPO.git
    echo 3. Pokreni: git branch -M main
    echo 4. Pokreni: git push -u origin main
) else (
    echo ✅ Git već postoji
    echo 📤 Push kod na GitHub...
    git add .
    git commit -m "Update for deployment"
    git push
    echo ✅ Kod je na GitHub!
)

echo.
echo 🌐 Spremno za deploy na Render.com ili Railway.app!
echo.
echo Render: https://dashboard.render.com/
echo Railway: https://railway.app/
pause
