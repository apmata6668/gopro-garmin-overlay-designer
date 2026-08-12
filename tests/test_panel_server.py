import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("overlay_panel_server", ROOT / "panel-server.py")
SERVER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SERVER)


def test_repair_video_path_removes_accidental_second_drive():
    broken = r"H:\video\clip001H:\activity\ride.fit.MP4"
    assert SERVER.repair_video_path(broken) == r"H:\video\clip001.MP4"


def test_output_extension_is_added():
    assert SERVER.ensure_output_extension("ride-overlay", "burn") == "ride-overlay.mp4"
    assert SERVER.ensure_output_extension("ride-overlay.mp4", "burn") == "ride-overlay.mp4"
    assert SERVER.ensure_output_extension("overlay.mp4", "overlay") == "overlay.mov"


def test_proxy_normalization():
    assert SERVER.normalize_map_proxy("127.0.0.1:10808") == "http://127.0.0.1:10808"
    assert SERVER.normalize_map_proxy("http://127.0.0.1:10808") == "http://127.0.0.1:10808"
    assert SERVER.normalize_map_proxy("") == ""


def test_command_log_redacts_mapbox_token():
    command = ["python", "tool.py", "--map-api-key", "pk.example-secret", "input.mp4"]
    rendered = SERVER.redacted_command_line(command)
    assert "pk.example-secret" not in rendered
    assert "<redacted>" in rendered


def test_public_settings_never_return_token(tmp_path, monkeypatch):
    settings_path = tmp_path / "settings.json"
    monkeypatch.setattr(SERVER, "SETTINGS_PATH", settings_path)
    monkeypatch.setattr(SERVER, "APP_DATA_DIR", tmp_path)
    SERVER.write_app_settings({"mapApiKey": "pk.local-only", "mapStyle": "mapbox-satellite"})
    public, has_key = SERVER.public_app_settings()
    assert has_key is True
    assert "mapApiKey" not in public
    assert public["mapStyle"] == "mapbox-satellite"


def test_blank_token_does_not_clear_saved_token(tmp_path, monkeypatch):
    settings_path = tmp_path / "settings.json"
    monkeypatch.setattr(SERVER, "SETTINGS_PATH", settings_path)
    monkeypatch.setattr(SERVER, "APP_DATA_DIR", tmp_path)
    SERVER.write_app_settings({"mapApiKey": "pk.keep-me"})
    SERVER.write_app_settings({"mapApiKey": "", "theme": "day"})
    assert SERVER.read_app_settings()["mapApiKey"] == "pk.keep-me"


def test_explicit_missing_font_has_clear_error(tmp_path):
    with pytest.raises(FileNotFoundError, match="Overlay font not found"):
        SERVER.resolve_overlay_font({"fontPath": str(tmp_path / "missing.ttf")})
