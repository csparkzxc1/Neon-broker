#!/usr/bin/env python3
"""Tiny static server for the NEON BROKER solo build prototype.

Run:    python3 serve.py
Then:   open http://localhost:8000
"""
import http.server, socketserver, os, sys

PORT = int(os.environ.get('PORT', 8000))

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print(f'NEON BROKER serving at http://localhost:{PORT}')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            sys.exit(0)
