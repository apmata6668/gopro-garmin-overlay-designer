# Third-Party Notices

This project is a local user interface and integration layer built around third-party software and map services.

## GoPro Dashboard Overlay

- Project: `time4tea/gopro-dashboard-overlay`
- Package: `gopro-overlay==0.134.0`
- License: GNU General Public License v3.0 or later
- Source: <https://github.com/time4tea/gopro-dashboard-overlay>

The XML examples under `web/official-layouts/` originate from or are adapted from the upstream project. The compatibility scripts modify an installed copy of version `0.134.0`; those modifications are clearly identified by the `enable-*.py` scripts and remain covered by the GPL.

## FFmpeg

FFmpeg is not included in the source repository. Users may install it separately or include a compatible build in a portable package. FFmpeg licensing depends on how that build was configured. A distributor must include the license and source-code information required by the selected FFmpeg build.

## Map Data and Imagery

- OpenStreetMap data is provided by OpenStreetMap contributors.
- CyclOSM uses OpenStreetMap data and its own tile service.
- Mapbox satellite imagery and APIs are governed by Mapbox terms and require an access token.

Users and distributors are responsible for following each provider's current attribution, caching, access-token and usage requirements. This repository does not contain a Mapbox token.

## Fonts and Trademarks

Microsoft YaHei and other system fonts are detected from Windows but are not redistributed. GoPro, Garmin, Mapbox and other product names are trademarks of their respective owners. This project is not affiliated with or endorsed by those companies.
