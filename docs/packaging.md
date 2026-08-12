# Windows Package and EXE Packaging

## Windows installation ZIP

Run `scripts\build-windows-package.ps1`. The script creates a clean ZIP under `dist/` without copying local settings, tokens, videos, logs, map caches or the developer's virtual environment.

On the target Windows PC, install Python 3.11 or newer, extract the ZIP and double-click `setup-and-start.bat`. It creates a machine-local `venv`, installs the pinned dependency, applies the compatibility modules and starts the panel.

FFmpeg is intentionally not included. Redistributing FFmpeg requires choosing a compatible build and satisfying its applicable license and source-offer requirements.

Do not call a copied Python `venv` portable: Windows virtual environments contain absolute paths to the build machine and are not a reliable cross-computer runtime.

## Future EXE

The current application is deliberately structured for a later desktop wrapper:

- static assets are isolated under `web/`;
- mutable files live under `%LOCALAPPDATA%\OverlayDesigner`;
- no user-specific absolute path is required;
- the backend binds only to loopback and chooses an available port.

A future EXE can use PyInstaller for Python and PyWebView for the native window. Before publishing an EXE, add version metadata, an icon, an uninstaller, code signing, clean-machine tests and third-party license files. Do not embed access tokens. PyInstaller work also needs to replace the current dependency entry-point scripts with packaged callable modules.
