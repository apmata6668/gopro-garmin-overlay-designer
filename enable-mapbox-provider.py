from importlib.metadata import version
from pathlib import Path

import gopro_overlay.geo as geo

SUPPORTED_GOPRO_OVERLAY = "0.134.0"


def require_supported_version():
    installed = version("gopro-overlay")
    if installed != SUPPORTED_GOPRO_OVERLAY:
        raise RuntimeError(
            f"Unsupported gopro-overlay version {installed}; expected {SUPPORTED_GOPRO_OVERLAY}. "
            "Re-run the installer to restore the pinned dependency."
        )


def main():
    require_supported_version()
    path = Path(geo.__file__)
    text = path.read_text(encoding="utf-8")
    if "class MapboxStyleConfig" in text and "MapboxStyleConfig()" in text:
        return

    anchor = "class GeoapifyStyleConfig(PrefixMapStyleConfig):"
    provider = '''class MapboxStyleConfig(PrefixMapStyleConfig):

    def __init__(self):
        super().__init__("mapbox")

    def _styles(self) -> List[str]:
        return ["satellite"]

    def _attributes(self, style: str) -> Dict:
        assert style in self._styles()
        return {
            "name": "Mapbox Satellite",
            "attribution": "Maps and imagery (c) Mapbox",
            "url": "https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.jpg90?access_token={api_key}",
            "api-key-ref": "mapbox",
            "limit": 4,
        }


'''
    if anchor not in text:
        raise RuntimeError(f"Could not locate map provider insertion point in {path}")
    backup = path.with_suffix(path.suffix + ".overlay-designer.bak")
    if not backup.exists():
        backup.write_text(text, encoding="utf-8")
    text = text.replace(anchor, provider + anchor, 1)

    old = (
        "configurations = [OSMStyleConfig(), CyclOSMStyleConfig(), ThunderforestStyleConfig(), GeoapifyStyleConfig(),\n"
        "                  LocalStyleConfig()]"
    )
    new = (
        "configurations = [OSMStyleConfig(), CyclOSMStyleConfig(), MapboxStyleConfig(), ThunderforestStyleConfig(),\n"
        "                  GeoapifyStyleConfig(), LocalStyleConfig()]"
    )
    if old not in text:
        raise RuntimeError(f"Could not locate map provider registry in {path}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print("Mapbox satellite provider enabled.")


if __name__ == "__main__":
    main()
