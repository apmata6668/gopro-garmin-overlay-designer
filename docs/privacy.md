# Privacy and Data Handling

The application runs locally. GoPro videos, Garmin FIT/GPX files and generated videos are read from and written to paths selected by the user; they are not uploaded by the application.

GPS tracks can reveal home, work and frequently visited locations. Before attaching logs or sample data to a GitHub issue:

1. Remove or replace real video and activity paths.
2. Crop or anonymize GPS tracks.
3. Remove Mapbox tokens and proxy addresses.
4. Review screenshots for personal folders, dates and coordinates.

Map tiles are requested from the selected external provider. When a proxy is enabled, map requests use that proxy. Video and FIT/GPX files are not sent to map providers.
