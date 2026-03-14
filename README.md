# Dashboard (Static Concept)

This folder contains a standalone, static host-dashboard concept page for the Kaleidoscope project.

## Open It

- Open `index.html` directly in a browser (double-click), or
- Run a tiny static server from this folder (recommended):

```bash
cd kaleidoscope/dashboard
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

Note: `python index.html` tries to execute the HTML as Python and will fail.

## One-Command Serve

```bash
cd kaleidoscope/dashboard
python3 serve.py
```

This serves from the repo root, so you can also open the landing page at `/website/index.html` on the same port.
