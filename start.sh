#!/bin/bash
# Script de démarrage rapide avec vérification

echo "🎮 Idle Rift Slayers - Démarrage"
echo "================================"
echo ""

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé"
    exit 1
fi

echo "✅ Python 3 détecté"
echo ""

# Demander le port
read -p "Port (défaut: 8000): " PORT
PORT=${PORT:-8000}

echo ""
echo "🚀 Démarrage du serveur anti-cache sur le port $PORT"
echo "📝 Mode: NO CACHE (développement)"
echo "🌐 URL: http://localhost:$PORT"
echo ""
echo "⏹️  Appuyez sur Ctrl+C pour arrêter"
echo "================================"
echo ""

# Démarrer le serveur
python3 server.py $PORT
