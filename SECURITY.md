# Security Policy

## Supported Version

Security fixes are currently applied to the latest release on the `main` branch.

## Reporting a Vulnerability

Use GitHub's private security advisory feature instead of opening a public issue. Include the affected version, reproduction steps and the expected impact. Do not include real access tokens, private GPS tracks or personal video files.

## Local Security Model

The application binds only to `127.0.0.1`, serves files only from `web/`, rejects cross-origin POST requests and does not enable CORS. Runtime data is stored under `%LOCALAPPDATA%\OverlayDesigner`.

Mapbox tokens are stored locally and are not returned by the settings API or written into render logs. Tokens should still be restricted, rotated when exposed and excluded from bug reports.

The application launches FFmpeg and Python subprocesses using argument arrays rather than a command shell. Users should only open trusted layout and preset files.
