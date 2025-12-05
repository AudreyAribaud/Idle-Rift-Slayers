#!/usr/bin/env python3
"""
Serveur HTTP simple avec headers anti-cache pour le développement
Usage: python3 server.py [port]
"""

import http.server
import socketserver
import sys
from datetime import datetime

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler HTTP avec headers anti-cache"""
    
    def end_headers(self):
        # Headers anti-cache pour tous les fichiers
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        # CORS pour le développement
        self.send_header('Access-Control-Allow-Origin', '*')
        
        super().end_headers()
    
    def log_message(self, format, *args):
        """Log personnalisé avec timestamp"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

# Configuration du serveur
Handler = NoCacheHTTPRequestHandler
Handler.extensions_map.update({
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.html': 'text/html',
    '.webmanifest': 'application/manifest+json',
})

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"🚀 Serveur démarré sur http://localhost:{PORT}")
    print(f"📝 Mode: NO CACHE (développement)")
    print(f"⏹️  Arrêter avec Ctrl+C")
    print("-" * 50)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Serveur arrêté")
        sys.exit(0)
