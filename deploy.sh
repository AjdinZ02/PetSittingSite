#!/bin/bash
# Skripta za brz deploy

echo "🚀 Priprema za deploy..."

# Proveri da li postoji Git
if ! command -v git &> /dev/null; then
    echo "❌ Git nije instaliran. Preuzmi sa: https://git-scm.com"
    exit 1
fi

# Ako nije Git repo, inicijalizuj
if [ ! -d ".git" ]; then
    echo "📦 Inicijalizacija Git repozitorijuma..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
    echo "✅ Git repo kreiran!"
    echo ""
    echo "Sledeći koraci:"
    echo "1. Kreiraj GitHub repozitorijum"
    echo "2. Pokreni: git remote add origin https://github.com/TVOJE-IME/NAZIV-REPO.git"
    echo "3. Pokreni: git push -u origin main"
else
    echo "✅ Git već postoji"
    echo "📤 Push kod na GitHub..."
    git add .
    git commit -m "Update for deployment - $(date)"
    git push
    echo "✅ Kod je na GitHub!"
fi

echo ""
echo "🌐 Spremno za deploy na Render.com ili Railway.app!"
