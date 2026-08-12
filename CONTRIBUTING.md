# Contributing

## Development Setup

1. Install Python 3.11 or newer.
2. Run `install-gopro-overlay-windows.ps1` on Windows.
3. Install development tools with `venv\Scripts\python.exe -m pip install -r requirements-dev.txt`.
4. Run tests with `venv\Scripts\python.exe -m pytest`.
5. Start the application with `start-panel.bat`.

## Pull Requests

- Keep media, FIT/GPX files, tokens, logs and map tiles out of commits.
- Add focused tests for backend behavior.
- Test at both 1920x1080 and 3840x2160 when changing layout XML.
- Preserve existing user data and avoid unrelated formatting churn.
- Explain any upstream compatibility patch and the exact supported `gopro-overlay` version.

By contributing, you agree that your contribution is licensed under GPL-3.0-or-later.
