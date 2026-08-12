from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SKIP_PARTS = {".git", "venv", ".venv", "__pycache__"}
TEXT_SUFFIXES = {".py", ".js", ".css", ".html", ".md", ".json", ".xml", ".ps1", ".bat", ".toml", ".yml", ".yaml"}


def repository_files():
    for path in ROOT.rglob("*"):
        if not path.is_file() or any(part in SKIP_PARTS for part in path.parts):
            continue
        yield path


def test_no_private_paths_or_live_mapbox_tokens():
    # Build markers from fragments so this test does not flag its own source.
    forbidden = (
        "C:" + r"\Users" + r"\hhh",
        "H:" + r"\mtb",
        "pk." + "eyJ",
    )
    findings = []
    for path in repository_files():
        if path.suffix.lower() not in TEXT_SUFFIXES:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for marker in forbidden:
            if marker in text:
                findings.append(f"{path.relative_to(ROOT)} contains {marker}")
    assert findings == []


def test_no_large_or_private_media_files():
    forbidden_suffixes = {".mp4", ".mov", ".m4v", ".avi", ".lrv", ".360", ".fit", ".gpx"}
    findings = []
    for path in repository_files():
        if path.suffix.lower() in forbidden_suffixes or path.stat().st_size > 20 * 1024 * 1024:
            findings.append(str(path.relative_to(ROOT)))
    assert findings == []


def test_official_layouts_are_well_formed_xml():
    layouts = sorted((ROOT / "web" / "official-layouts").glob("*.xml"))
    assert layouts
    for layout in layouts:
        root = ET.parse(layout).getroot()
        assert root.tag == "layout"
