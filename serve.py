#!/usr/bin/env python3
from __future__ import annotations

import http.server
import os
import socketserver
import sys
import webbrowser
from pathlib import Path


class MappedHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Browsers often request these implicitly; we don't ship PNG/ICO in the static concept.
        if self.path in (
            "/favicon.ico",
            "/apple-touch-icon.png",
            "/apple-touch-icon-precomposed.png",
        ):
            self.send_response(302)
            self.send_header("Location", "/favicon.svg")
            self.end_headers()
            return
        super().do_GET()


class QuietTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

    def handle_error(self, request, client_address):
        exc = sys.exc_info()[1]
        if isinstance(exc, BrokenPipeError):
            return
        super().handle_error(request, client_address)


def main() -> int:
    # Serve from repo root so /website and /dashboard both work on one port.
    root = Path(__file__).resolve().parent.parent
    os.chdir(root)

    handler = MappedHandler

    # Bind to a free port if 8080 is taken.
    for port in (8080, 0):
        try:
            with QuietTCPServer(("127.0.0.1", port), handler) as httpd:
                host, chosen_port = httpd.server_address
                url = f"http://{host}:{chosen_port}/dashboard/index.html"
                print(f"Serving {root} at {url}")
                try:
                    webbrowser.open(url)
                except Exception:
                    pass
                httpd.serve_forever()
            break
        except OSError:
            continue

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
