# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 - 2026-07-17

### Added

- Visual GoPro/Garmin overlay layout editor.
- GoPro GPS and IMU data controls.
- Garmin FIT/GPX merge and GPS position-alignment modes.
- Editable official XML layout presets.
- Real-frame preview, render progress and recent logs.
- CPU, NVIDIA NVENC/CUDA, Intel QSV and AMD AMF capability detection.
- Mapbox satellite, CyclOSM and OpenStreetMap providers.
- Persistent local settings and output-folder selection.

### Security

- Runtime data moved to `%LOCALAPPDATA%\OverlayDesigner`.
- Static HTTP serving restricted to `web/`.
- Mapbox tokens removed from API responses and command logs.
- Cross-origin POST requests rejected.
