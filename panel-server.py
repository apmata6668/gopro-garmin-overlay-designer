import json
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"
APP_DATA_DIR = Path(os.environ.get("LOCALAPPDATA") or BASE_DIR / ".local") / "OverlayDesigner"
RUNTIME_DIR = APP_DATA_DIR / "runtime"
CONFIG_DIR = APP_DATA_DIR / "config"
CACHE_DIR = APP_DATA_DIR / "map-cache"
LOG_PATH = RUNTIME_DIR / "render-log.txt"
LOG_DIR = RUNTIME_DIR / "render-logs"
LOG_HISTORY_LIMIT = 10
PREVIEW_LOG_PATH = RUNTIME_DIR / "preview-log.txt"
PREVIEW_PATH = RUNTIME_DIR / "preview-frame.png"
LAYOUT_PATH = RUNTIME_DIR / "my-layout.xml"
EMPTY_LAYOUT_PATH = RUNTIME_DIR / "empty-layout.xml"
STATE_PATH = RUNTIME_DIR / "render-state.json"
SETTINGS_PATH = APP_DATA_DIR / "settings.json"
DEFAULT_FFMPEG = ""
PANEL_CUDA_PROFILE = "panel_nnvgpu"
PANEL_NVGPU_PROFILE = "panel_nvgpu"
PANEL_AMF_PROFILE = "panel_amf_h264"

render_process = None
render_command = None
render_output = None
render_started = None
render_log_handle = None
lock = threading.Lock()
hardware_probe_cache = {}


def ensure_runtime_dirs():
    for directory in (APP_DATA_DIR, RUNTIME_DIR, CONFIG_DIR, CACHE_DIR, LOG_DIR):
        directory.mkdir(parents=True, exist_ok=True)


def find_ffmpeg_dir(requested=""):
    requested = str(requested or "").strip().strip('"')
    candidates = []
    if requested:
        candidates.append(Path(requested))
    settings_path = str(read_app_settings().get("ffmpegDir") or "").strip()
    if settings_path and settings_path != requested:
        candidates.append(Path(settings_path))
    bundled = BASE_DIR / "runtime" / "ffmpeg" / "bin"
    candidates.append(bundled)
    discovered = shutil.which("ffmpeg")
    if discovered:
        candidates.append(Path(discovered).resolve().parent)
    for candidate in candidates:
        executable = candidate / ("ffmpeg.exe" if os.name == "nt" else "ffmpeg")
        if executable.exists():
            return str(candidate)
    return requested


def probe_video_rotation(video_path, ffmpeg_dir):
    ffprobe = Path(ffmpeg_dir) / ("ffprobe.exe" if os.name == "nt" else "ffprobe")
    if not ffprobe.exists():
        return 0
    try:
        result = subprocess.run(
            [
                str(ffprobe), "-v", "error", "-select_streams", "v:0",
                "-show_entries", "stream_side_data=rotation", "-of", "json", str(video_path),
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            timeout=15,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        payload = json.loads(result.stdout or "{}")
        side_data = (payload.get("streams") or [{}])[0].get("side_data_list") or []
        for item in side_data:
            if "rotation" in item:
                return int(round(float(item["rotation"]))) % 360
    except (OSError, ValueError, TypeError, IndexError, subprocess.SubprocessError):
        pass
    return 0


def normalize_video_bitrate(value):
    match = re.fullmatch(r"\s*(\d{1,3})(?:M|Mbps)?\s*", str(value or "80M"), re.IGNORECASE)
    number = int(match.group(1)) if match else 80
    return f"{max(10, min(150, number))}M"


def resolve_overlay_font(payload=None):
    payload = payload or {}
    requested = str(payload.get("fontPath") or "").strip().strip('"')
    if requested:
        requested_path = Path(requested).expanduser()
        if requested_path.exists():
            return str(requested_path)
        if not requested_path.is_absolute() and not any(char in requested for char in ("/", "\\")):
            return requested
        raise FileNotFoundError(f"Overlay font not found: {requested}")

    windows_dir = Path(os.environ.get("WINDIR") or r"C:\Windows")
    candidates = [
        BASE_DIR / "assets" / "fonts" / "NotoSansSC-Regular.otf",
        BASE_DIR / "assets" / "fonts" / "NotoSansCJKsc-Regular.otf",
        windows_dir / "Fonts" / "msyh.ttc",
        windows_dir / "Fonts" / "simhei.ttf",
        windows_dir / "Fonts" / "Deng.ttf",
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    return "trebuc.ttf"


APP_SETTING_KEYS = {
    "ffmpegDir", "overlayFont", "mapStyle", "mapApiKey", "mapZoom",
    "useMapProxy", "mapProxy", "encoderProfile", "videoBitrate",
    "canvasWidth", "canvasHeight", "speedUnit", "altUnit", "theme",
}


def read_app_settings():
    try:
        payload = json.loads(SETTINGS_PATH.read_text(encoding="utf-8")) if SETTINGS_PATH.exists() else {}
    except (OSError, ValueError, TypeError):
        payload = {}
    return {key: value for key, value in payload.items() if key in APP_SETTING_KEYS}


def public_app_settings():
    settings = read_app_settings()
    has_map_api_key = bool(str(settings.pop("mapApiKey", "") or "").strip())
    return settings, has_map_api_key


def write_app_settings(payload):
    settings = read_app_settings()
    updates = {key: value for key, value in payload.items() if key in APP_SETTING_KEYS}
    if not str(updates.get("mapApiKey") or "").strip():
        updates.pop("mapApiKey", None)
    settings.update(updates)
    APP_DATA_DIR.mkdir(parents=True, exist_ok=True)
    temporary = SETTINGS_PATH.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(settings, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(SETTINGS_PATH)
    return settings


def ffmpeg_executable(ffmpeg_dir):
    return Path(ffmpeg_dir) / ("ffmpeg.exe" if os.name == "nt" else "ffmpeg")


def probe_encoder(ffmpeg_path, encoder):
    command = [
        str(ffmpeg_path), "-hide_banner", "-loglevel", "error",
        "-f", "lavfi", "-i", "color=c=black:s=320x180:r=1:d=1",
        "-frames:v", "1", "-an", "-c:v", encoder, "-f", "null", "-",
    ]
    try:
        result = subprocess.run(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            errors="replace",
            timeout=12,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        detail_lines = [line.strip() for line in (result.stderr or "").splitlines() if line.strip()]
        detail = detail_lines[0] if detail_lines else ("Encoder test passed" if result.returncode == 0 else "Encoder test failed")
        return {"available": result.returncode == 0, "detail": detail}
    except subprocess.TimeoutExpired:
        return {"available": False, "detail": "Encoder test timed out"}
    except OSError as exc:
        return {"available": False, "detail": str(exc)}


def detect_gpu_names():
    if os.name != "nt":
        return []
    try:
        result = subprocess.run(
            [
                "powershell.exe", "-NoProfile", "-NonInteractive", "-Command",
                "Get-CimInstance Win32_VideoController | ForEach-Object { $_.Name }",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            errors="replace",
            timeout=10,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        return [line.strip() for line in result.stdout.splitlines() if line.strip()]
    except (OSError, subprocess.SubprocessError):
        return []


def probe_hardware(ffmpeg_dir, force=False):
    ffmpeg_path = ffmpeg_executable(ffmpeg_dir)
    cache_key = str(ffmpeg_path.resolve()) if ffmpeg_path.exists() else str(ffmpeg_path)
    if not force and cache_key in hardware_probe_cache:
        return hardware_probe_cache[cache_key]
    if not ffmpeg_path.exists():
        missing = {"available": False, "detail": f"ffmpeg not found: {ffmpeg_path}"}
        payload = {
            "gpus": detect_gpu_names(),
            "profiles": {
                "cpu": missing,
                "nvgpu": missing,
                "nnvgpu": missing,
                "qsv": missing,
                "amf_h264": missing,
            },
        }
        hardware_probe_cache[cache_key] = payload
        return payload

    nvenc = probe_encoder(ffmpeg_path, "h264_nvenc")
    qsv = probe_encoder(ffmpeg_path, "hevc_qsv")
    amf = probe_encoder(ffmpeg_path, "h264_amf")
    payload = {
        "gpus": detect_gpu_names(),
        "profiles": {
            "cpu": {"available": True, "detail": "CPU libx264"},
            "nvgpu": dict(nvenc),
            "nnvgpu": dict(nvenc),
            "qsv": qsv,
            "amf_h264": amf,
        },
    }
    hardware_probe_cache[cache_key] = payload
    return payload


def read_ffmpeg_profiles(profile_path):
    try:
        profiles = json.loads(profile_path.read_text(encoding="utf-8")) if profile_path.exists() else {}
    except (OSError, ValueError, TypeError):
        profiles = {}
    return profiles if isinstance(profiles, dict) else {}


def write_ffmpeg_profiles(profile_path, profiles):
    temporary = profile_path.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(profiles, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(profile_path)


def ensure_panel_cuda_profile(width, height, rotation=0, bitrate="80M"):
    width = max(320, min(8192, int(width)))
    height = max(180, min(8192, int(height)))
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    profile_path = CONFIG_DIR / "ffmpeg-profiles.json"

    profiles = read_ffmpeg_profiles(profile_path)
    bitrate = normalize_video_bitrate(bitrate)

    rotation %= 360
    device_input = [
        "-init_hw_device", "cuda=cuda",
        "-filter_hw_device", "cuda",
    ]
    output_options = [
        "-vcodec", "h264_nvenc",
        "-rc:v", "cbr",
        "-b:v", bitrate,
        "-bf:v", "3",
        "-profile:v", "main",
        "-spatial-aq", "true",
        "-movflags", "faststart",
    ]

    if rotation in (0, 180):
        device_input.extend(["-hwaccel", "cuda", "-hwaccel_output_format", "cuda"])
        main_filter = "[0:v]scale_cuda=format=yuv420p[mp4_stream];"
        overlay_filter = "[1:v]format=yuva420p,hwupload[overlay_stream];"
        if rotation == 180:
            device_input.append("-noautorotate")
            overlay_filter = "[1:v]format=yuva420p,hflip,vflip,hwupload[overlay_stream];"
    else:
        # Rare 90/270-degree clips use the compatibility path.
        main_filter = "[0:v]format=yuv420p,hwupload[mp4_stream];"
        overlay_filter = "[1:v]format=yuva420p,hwupload[overlay_stream];"

    profiles[PANEL_CUDA_PROFILE] = {
        "input": device_input,
        "filter": (
            main_filter +
            overlay_filter +
            "[mp4_stream][overlay_stream]overlay_cuda[composed];"
            f"[composed]hwdownload,format=yuv420p,crop={width}:{height}"
        ),
        "output": output_options,
    }
    write_ffmpeg_profiles(profile_path, profiles)
    return PANEL_CUDA_PROFILE


def ensure_panel_nvgpu_profile(bitrate="80M"):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    profile_path = CONFIG_DIR / "ffmpeg-profiles.json"
    profiles = read_ffmpeg_profiles(profile_path)
    profiles[PANEL_NVGPU_PROFILE] = {
        "input": ["-hwaccel", "nvdec"],
        "output": [
            "-vcodec", "h264_nvenc",
            "-rc:v", "cbr",
            "-b:v", normalize_video_bitrate(bitrate),
            "-bf:v", "3",
            "-profile:v", "high",
            "-spatial-aq", "true",
            "-movflags", "faststart",
        ],
    }
    write_ffmpeg_profiles(profile_path, profiles)
    return PANEL_NVGPU_PROFILE


def ensure_panel_amf_profile(bitrate="80M"):
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    profile_path = CONFIG_DIR / "ffmpeg-profiles.json"
    profiles = read_ffmpeg_profiles(profile_path)
    profiles[PANEL_AMF_PROFILE] = {
        "output": [
            "-vcodec", "h264_amf",
            "-usage", "transcoding",
            "-quality", "quality",
            "-rc", "cbr",
            "-b:v", normalize_video_bitrate(bitrate),
            "-profile:v", "high",
            "-movflags", "faststart",
        ],
    }
    write_ffmpeg_profiles(profile_path, profiles)
    return PANEL_AMF_PROFILE


def archive_current_log():
    if not LOG_PATH.exists() or LOG_PATH.stat().st_size == 0:
        return None
    LOG_DIR.mkdir(exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S", time.localtime(LOG_PATH.stat().st_mtime))
    target = LOG_DIR / f"render-{stamp}.log"
    suffix = 1
    while target.exists():
        target = LOG_DIR / f"render-{stamp}-{suffix}.log"
        suffix += 1
    LOG_PATH.replace(target)
    archives = sorted(LOG_DIR.glob("render-*.log"), key=lambda path: path.stat().st_mtime, reverse=True)
    for old_log in archives[max(0, LOG_HISTORY_LIMIT - 1):]:
        old_log.unlink(missing_ok=True)
    return target


def render_log_records():
    records = []
    if LOG_PATH.exists():
        records.append({
            "name": "current",
            "label": "当前 / 最近一次",
            "modified": LOG_PATH.stat().st_mtime,
        })
    if LOG_DIR.exists():
        archives = sorted(LOG_DIR.glob("render-*.log"), key=lambda path: path.stat().st_mtime, reverse=True)
        for path in archives[:max(0, LOG_HISTORY_LIMIT - len(records))]:
            records.append({
                "name": path.name,
                "label": path.stem.replace("render-", "").replace("-", " ", 1),
                "modified": path.stat().st_mtime,
            })
    return records


def read_render_log(name):
    if name == "current":
        path = LOG_PATH
    else:
        safe_name = Path(name or "").name
        if safe_name != name or not re.fullmatch(r"render-[0-9-]+\.log", safe_name):
            raise ValueError("Invalid log name")
        path = LOG_DIR / safe_name
    if not path.exists():
        raise FileNotFoundError("Render log not found")
    return path.read_text(encoding="utf-8", errors="replace")


def pick_port(start=8765):
    for port in range(start, start + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise RuntimeError("No available local port found")


def bool_value(value):
    return bool(value)




def repair_video_path(value):
    text = str(value or "").strip().strip('"')
    if not text:
        return text
    matches = list(re.finditer(r"[A-Za-z]:[\\/]", text))
    if len(matches) < 2:
        return text
    prefix = text[:matches[1].start()]
    ext_match = re.search(r"\.(mp4|mov|m4v|avi)$", text, re.IGNORECASE)
    if re.search(r"\.(mp4|mov|m4v|avi)$", prefix, re.IGNORECASE):
        return prefix
    return prefix + ext_match.group(0) if ext_match else prefix

def default_output_path(video_path, mode):
    suffix = "-overlay.mov" if mode == "overlay" else "-clean.mp4" if mode == "clean" else "-overlay.mp4"
    fallback = "overlay-only.mov" if mode == "overlay" else "clean-dashboard.mp4" if mode == "clean" else "dashboard-output.mp4"
    try:
        source = Path(video_path)
        if source.name:
            return str(source.with_name(source.stem + suffix))
    except Exception:
        pass
    return fallback


def is_bad_output_path(value):
    text = str(value or "").strip()
    if not text:
        return False
    if re.search(r"[<>|?*]", text):
        return True
    if re.search(r".+[A-Za-z]:[\\/]", text):
        return True
    return ":" in text and not re.match(r"^[A-Za-z]:[\\/]", text)


def ensure_output_extension(value, mode):
    text = str(value or "").strip()
    if not text:
        return text
    if mode == "overlay" and re.search(r"\.[^\\/\.]+$", text):
        return re.sub(r"\.[^\\/\.]+$", ".mov", text)
    if re.search(r"\.(mp4|mov|m4v|avi|webm)$", text, re.IGNORECASE):
        return text
    return text + (".mov" if mode == "overlay" else ".mp4")


def unique_output_path(value):
    path = Path(value)
    check_path = path if path.is_absolute() else BASE_DIR / path
    if not check_path.exists():
        return str(path)
    parent = path.parent if str(path.parent) != "." else Path(".")
    check_parent = check_path.parent
    stem = path.stem
    suffix = path.suffix
    for index in range(1, 1000):
        candidate = parent / f"{stem}-{index}{suffix}"
        check_candidate = check_parent / candidate.name if not candidate.is_absolute() else candidate
        if not check_candidate.exists():
            return str(candidate)
    candidate = parent / f"{stem}-{int(time.time())}{suffix}"
    return str(candidate)


def ensure_output_parent(value):
    path = Path(value)
    resolved = path if path.is_absolute() else BASE_DIR / path
    parent = resolved.parent
    if str(parent) and str(parent) != ".":
        parent.mkdir(parents=True, exist_ok=True)
    return value


def safe_output_path(value, video_path, mode):
    text = str(value or "").strip()
    if not text or is_bad_output_path(text):
        text = default_output_path(video_path, mode)
    else:
        text = ensure_output_extension(text, mode)
    return ensure_output_parent(unique_output_path(text))


def combine_output_fields(payload, mode):
    output_path = payload.get("outputPath")
    output_folder = str(payload.get("outputFolder") or "").strip()
    output_name = str(payload.get("outputName") or "").strip()
    if output_folder and output_name:
        return str(Path(output_folder) / Path(output_name).name)
    return output_path


def video_folder(value):
    repaired = repair_video_path(value)
    try:
        path = Path(repaired)
        return str(path.parent) if path.parent else str(BASE_DIR)
    except Exception:
        return str(BASE_DIR)


def existing_folder(value):
    text = str(value or "").strip().strip('"')
    if not text:
        return str(BASE_DIR)
    try:
        path = Path(text)
        if path.exists():
            return str(path if path.is_dir() else path.parent)
        parent = path.parent
        if parent.exists():
            return str(parent)
    except (OSError, ValueError):
        pass
    return str(BASE_DIR)


def input_dialog_options(kind):
    if kind == "video":
        return {
            "title": "Select GoPro video",
            "filetypes": [
                ("GoPro and video files", "*.mp4 *.MP4 *.mov *.MOV *.lrv *.LRV"),
                ("All files", "*.*"),
            ],
        }
    if kind == "data":
        return {
            "title": "Select Garmin FIT or GPX",
            "filetypes": [
                ("Garmin FIT and GPX files", "*.fit *.FIT *.gpx *.GPX"),
                ("All files", "*.*"),
            ],
        }
    raise ValueError(f"Unknown input file kind: {kind}")


def write_json(handler, status, payload):
    data = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


def read_json(handler):
    length = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(length)
    if not raw:
        return {}
    return json.loads(raw.decode("utf-8"))


def tail_log(max_chars=12000):
    if not LOG_PATH.exists():
        return ""
    text = LOG_PATH.read_text(encoding="utf-8", errors="replace")
    return text[-max_chars:]


def normalize_map_proxy(value):
    text = str(value or "").strip()
    if not text:
        return ""
    if re.match(r"^[a-z]+://", text, re.IGNORECASE):
        return text
    return "http://" + text


def render_environment(payload=None):
    payload = payload or {}
    env = os.environ.copy()
    for name in ["HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy"]:
        env.pop(name, None)
    use_map_proxy = bool_value(payload.get("useMapProxy"))
    map_proxy = normalize_map_proxy(payload.get("mapProxy") or "http://127.0.0.1:10808") if use_map_proxy else ""
    if map_proxy:
        env["HTTP_PROXY"] = map_proxy
        env["HTTPS_PROXY"] = map_proxy
        env["ALL_PROXY"] = map_proxy
        env["http_proxy"] = map_proxy
        env["https_proxy"] = map_proxy
        env["all_proxy"] = map_proxy
    env["NO_PROXY"] = "localhost,127.0.0.1"
    env["no_proxy"] = "localhost,127.0.0.1"
    site_packages = str(BASE_DIR / "venv" / "Lib" / "site-packages")
    if Path(site_packages).exists():
        env["PYTHONPATH"] = site_packages + (os.pathsep + env["PYTHONPATH"] if env.get("PYTHONPATH") else "")
    return env


def write_render_state(pid, output_path):
    STATE_PATH.write_text(json.dumps({"pid": pid, "output": output_path, "time": time.time()}, ensure_ascii=False), encoding="utf-8")


def read_render_state():
    try:
        if STATE_PATH.exists():
            return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}
    return {}


def clear_render_state():
    try:
        STATE_PATH.unlink(missing_ok=True)
    except OSError:
        pass


def pid_is_running(pid):
    if not pid:
        return False
    if os.name == "nt":
        result = subprocess.run(["tasklist", "/FI", f"PID eq {pid}"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, creationflags=subprocess.CREATE_NO_WINDOW)
        return str(pid) in result.stdout
    try:
        os.kill(int(pid), 0)
        return True
    except OSError:
        return False


def resolved_output_path(value):
    if not value:
        return None
    path = Path(value)
    return path if path.is_absolute() else BASE_DIR / path


def append_render_log(message):
    with LOG_PATH.open("a", encoding="utf-8", errors="replace") as log_file:
        log_file.write("\n" + message.rstrip() + "\n")


def redacted_command_line(command):
    safe = list(command)
    for index, value in enumerate(safe[:-1]):
        if value == "--map-api-key":
            safe[index + 1] = "<redacted>"
    return subprocess.list2cmdline(safe)

def remove_partial_output(value):
    path = resolved_output_path(value)
    if not path:
        return None
    try:
        if path.exists():
            path.unlink()
            return str(path)
    except OSError as exc:
        return f"Could not remove {path}: {exc}"
    return None


def terminate_process_tree(proc=None, pid=None):
    target_pid = pid or (proc.pid if proc is not None else None)
    if not target_pid:
        return
    if proc is not None and proc.poll() is not None and not pid_is_running(target_pid):
        return
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(target_pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        if proc is not None:
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=5)
        return
    if proc is not None:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=5)


def build_command(payload):
    mode = payload.get("mode") or "burn"
    video_path = repair_video_path(payload.get("videoPath") or r"C:\Videos\GH010001.MP4")
    data_path = payload.get("dataPath") or r"C:\Garmin\activity.fit"
    ffmpeg_dir = find_ffmpeg_dir(payload.get("ffmpegDir"))
    speed_unit = payload.get("speedUnit") or "kph"
    alt_unit = payload.get("altUnit") or "metre"
    gps_sync = payload.get("gpsSync") or "time"
    map_style = payload.get("mapStyle") or "cyclosm"
    map_api_key = str(payload.get("mapApiKey") or read_app_settings().get("mapApiKey") or "").strip()
    font_path = resolve_overlay_font(payload)
    encoder_profile = payload.get("encoderProfile") or "cpu"
    video_bitrate = normalize_video_bitrate(payload.get("videoBitrate"))
    cache_dir = CACHE_DIR
    use_external = bool_value(payload.get("useExternalData"))
    use_gopro_imu = bool_value(payload.get("useGoproImu"))
    compare_gps = bool_value(payload.get("compareGps"))
    merge = "EXTEND" if compare_gps or payload.get("useGoproGps", True) else "OVERWRITE"
    width = str(payload.get("canvasWidth") or "1920")
    height = str(payload.get("canvasHeight") or "1080")
    output_path = safe_output_path(combine_output_fields(payload, mode) or "dashboard-output.mp4", video_path, mode)

    if not Path(video_path).exists():
        raise FileNotFoundError(f"GoPro video not found: {video_path}")
    if use_external and not Path(data_path).exists():
        raise FileNotFoundError(f"Garmin FIT/GPX file not found: {data_path}")
    if gps_sync == "position" and not use_external:
        raise ValueError("GPS position sync requires a Garmin FIT/GPX file")
    if not ffmpeg_dir or not ffmpeg_executable(ffmpeg_dir).exists():
        raise FileNotFoundError("ffmpeg was not found. Select its bin folder in Settings or add ffmpeg to PATH.")
    cache_dir.mkdir(parents=True, exist_ok=True)

    python_exe = BASE_DIR / "venv" / "Scripts" / "python.exe"
    dashboard_py = BASE_DIR / "venv" / "Scripts" / "gopro-dashboard.py"
    if not python_exe.exists() or not dashboard_py.exists():
        raise FileNotFoundError("venv is missing. Run install-gopro-overlay-windows.ps1 first.")

    layout_path = EMPTY_LAYOUT_PATH if mode == "clean" else LAYOUT_PATH
    if not layout_path.exists():
        raise FileNotFoundError(f"Layout XML not found: {layout_path}")

    cmd = [
        str(python_exe),
        str(dashboard_py),
        "--font", font_path,
        "--ffmpeg-dir", ffmpeg_dir,
        "--config-dir", str(CONFIG_DIR),
        "--map-style", map_style,
        "--cache-dir", str(cache_dir),
    ]

    if map_api_key:
        cmd.extend(["--map-api-key", map_api_key])

    if use_gopro_imu:
        cmd.extend(["--load", "ACCL", "GRAV", "CORI"])

    if use_external:
        data_flag = "--fit" if str(data_path).lower().endswith(".fit") else "--gpx"
        cmd.extend([data_flag, data_path, "--gpx-merge", merge, "--gps-sync", gps_sync])
        if compare_gps:
            cmd.append("--gpx-compare")

    cmd.extend([
        "--layout", "xml",
        "--layout-xml", str(layout_path),
        "--units-speed", speed_unit,
        "--units-altitude", alt_unit,
    ])

    display_rotation = 0
    if mode == "overlay":
        cmd.extend(["--generate", "overlay", "--profile", "mov", "--overlay-size", f"{width}x{height}"])
    elif mode == "clean":
        output_path = safe_output_path(combine_output_fields(payload, mode) or "clean-dashboard.mp4", video_path, mode)
    elif encoder_profile == "nnvgpu":
        display_rotation = probe_video_rotation(video_path, ffmpeg_dir)
        cmd.extend(["--profile", ensure_panel_cuda_profile(width, height, display_rotation, video_bitrate)])
    elif encoder_profile == "nvgpu":
        cmd.extend(["--profile", ensure_panel_nvgpu_profile(video_bitrate)])
    elif encoder_profile == "amf_h264":
        cmd.extend(["--profile", ensure_panel_amf_profile(video_bitrate)])
    elif encoder_profile != "cpu":
        cmd.extend(["--profile", encoder_profile])

    cmd.extend([video_path, output_path])
    if display_rotation == 180:
        wrapper = BASE_DIR / "render-wrapper.py"
        if not wrapper.exists():
            raise FileNotFoundError("render-wrapper.py is missing")
        cmd = [
            str(python_exe), str(wrapper),
            "--ffmpeg-dir", ffmpeg_dir,
            "--rotation", "180",
            "--output", output_path,
            "--",
        ] + cmd
    return cmd, str(Path(output_path))


def build_preview_command(payload):
    video_path = repair_video_path(payload.get("videoPath") or r"C:\Videos\GH010001.MP4")
    data_path = payload.get("dataPath") or r"C:\Garmin\activity.fit"
    ffmpeg_dir = find_ffmpeg_dir(payload.get("ffmpegDir"))
    speed_unit = payload.get("speedUnit") or "kph"
    alt_unit = payload.get("altUnit") or "metre"
    gps_sync = payload.get("gpsSync") or "time"
    map_style = payload.get("mapStyle") or "cyclosm"
    map_api_key = str(payload.get("mapApiKey") or read_app_settings().get("mapApiKey") or "").strip()
    font_path = resolve_overlay_font(payload)
    cache_dir = CACHE_DIR
    use_external = bool_value(payload.get("useExternalData"))
    use_gopro_imu = bool_value(payload.get("useGoproImu"))
    compare_gps = bool_value(payload.get("compareGps"))
    merge = "EXTEND" if compare_gps or payload.get("useGoproGps", True) else "OVERWRITE"
    width = str(payload.get("canvasWidth") or "1920")
    height = str(payload.get("canvasHeight") or "1080")

    if not Path(video_path).exists():
        raise FileNotFoundError(f"GoPro video not found: {video_path}")
    if use_external and not Path(data_path).exists():
        raise FileNotFoundError(f"Garmin FIT/GPX file not found: {data_path}")
    if gps_sync == "position" and not use_external:
        raise ValueError("GPS position sync requires a Garmin FIT/GPX file")
    if not ffmpeg_dir or not ffmpeg_executable(ffmpeg_dir).exists():
        raise FileNotFoundError("ffmpeg was not found. Select its bin folder in Settings or add ffmpeg to PATH.")
    cache_dir.mkdir(parents=True, exist_ok=True)

    python_exe = BASE_DIR / "venv" / "Scripts" / "python.exe"
    preview_py = BASE_DIR / "preview-frame.py"
    if not python_exe.exists() or not preview_py.exists():
        raise FileNotFoundError("preview-frame.py or venv is missing.")

    cmd = [
        str(python_exe),
        str(preview_py),
        "--font", font_path,
        "--ffmpeg-dir", ffmpeg_dir,
        "--config-dir", str(CONFIG_DIR),
        "--map-style", map_style,
        "--cache-dir", str(cache_dir),
    ]

    if map_api_key:
        cmd.extend(["--map-api-key", map_api_key])

    if use_gopro_imu:
        cmd.extend(["--load", "ACCL", "GRAV", "CORI"])

    if use_external:
        data_flag = "--fit" if str(data_path).lower().endswith(".fit") else "--gpx"
        cmd.extend([data_flag, data_path, "--gpx-merge", merge, "--gps-sync", gps_sync])
        if compare_gps:
            cmd.append("--gpx-compare")

    cmd.extend([
        "--layout-xml", str(LAYOUT_PATH),
        "--overlay-size", f"{width}x{height}",
        "--units-speed", speed_unit,
        "--units-altitude", alt_unit,
        video_path,
        str(PREVIEW_PATH),
    ])
    return cmd


class PanelHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'")
        super().end_headers()

    def origin_is_allowed(self):
        origin = self.headers.get("Origin")
        if not origin:
            return True
        port = self.server.server_address[1]
        return origin in {f"http://127.0.0.1:{port}", f"http://localhost:{port}"}

    def log_message(self, fmt, *args):
        if sys.stdout is None:
            return
        try:
            sys.stdout.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))
        except (AttributeError, OSError, ValueError):
            pass

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/preview-image":
            if not PREVIEW_PATH.exists():
                write_json(self, 404, {"ok": False, "error": "Preview image not found"})
                return
            data = PREVIEW_PATH.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "image/png")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        if parsed.path == "/api/settings":
            settings, has_map_api_key = public_app_settings()
            write_json(self, 200, {
                "ok": True,
                "settings": settings,
                "hasMapApiKey": has_map_api_key,
                "defaultFont": resolve_overlay_font({}),
            })
            return
        if parsed.path == "/api/hardware":
            query = parse_qs(parsed.query)
            ffmpeg_dir = find_ffmpeg_dir((query.get("ffmpegDir") or [""])[0])
            force = (query.get("force") or ["0"])[0] == "1"
            write_json(self, 200, {"ok": True, **probe_hardware(ffmpeg_dir, force=force)})
            return
        if parsed.path == "/api/logs":
            write_json(self, 200, {"logs": render_log_records(), "limit": LOG_HISTORY_LIMIT})
            return
        if parsed.path == "/api/log":
            try:
                name = (parse_qs(parsed.query).get("name") or ["current"])[0]
                write_json(self, 200, {"name": name, "text": read_render_log(name)})
            except (ValueError, FileNotFoundError) as exc:
                write_json(self, 404, {"ok": False, "error": str(exc)})
            return
        if parsed.path == "/api/status":
            with lock:
                proc = render_process
                running = proc is not None and proc.poll() is None
                code = None if proc is None else proc.poll()
                if not running and code is not None:
                    clear_render_state()
                payload = {
                    "running": running,
                    "returncode": code,
                    "command": render_command,
                    "output": render_output,
                    "started": render_started,
                    "log": tail_log(),
                }
            write_json(self, 200, payload)
            return
        return super().do_GET()

    def do_POST(self):
        global render_process, render_command, render_output, render_started, render_log_handle
        parsed = urlparse(self.path)
        if not self.origin_is_allowed():
            write_json(self, 403, {"ok": False, "error": "Cross-origin requests are not allowed"})
            return
        try:
            payload = read_json(self)
            if parsed.path == "/api/settings":
                write_app_settings(payload)
                public_settings, has_map_api_key = public_app_settings()
                write_json(self, 200, {"ok": True, "settings": public_settings, "hasMapApiKey": has_map_api_key})
                return
            if parsed.path == "/api/save-layout":
                xml = payload.get("xml") or "<layout>\n</layout>\n"
                target = EMPTY_LAYOUT_PATH if payload.get("mode") == "clean" else LAYOUT_PATH
                target.write_text(xml, encoding="utf-8")
                write_json(self, 200, {"ok": True, "path": str(target)})
                return

            if parsed.path == "/api/select-output-folder":
                initial = payload.get("outputFolder") or video_folder(payload.get("videoPath")) or str(BASE_DIR)
                try:
                    import tkinter as tk
                    from tkinter import filedialog
                    root = tk.Tk()
                    root.withdraw()
                    root.attributes("-topmost", True)
                    folder = filedialog.askdirectory(initialdir=initial, title="Select output folder")
                    root.destroy()
                    write_json(self, 200, {"ok": True, "folder": folder or ""})
                except Exception as exc:
                    write_json(self, 500, {"ok": False, "error": f"Could not open folder chooser: {exc}"})
                return

            if parsed.path == "/api/select-input-file":
                kind = payload.get("kind")
                options = input_dialog_options(kind)
                initial = existing_folder(payload.get("currentPath"))
                root = None
                try:
                    import tkinter as tk
                    from tkinter import filedialog
                    root = tk.Tk()
                    root.withdraw()
                    root.attributes("-topmost", True)
                    selected = filedialog.askopenfilename(
                        initialdir=initial,
                        title=options["title"],
                        filetypes=options["filetypes"],
                    )
                    write_json(self, 200, {"ok": True, "path": selected or ""})
                except Exception as exc:
                    write_json(self, 500, {"ok": False, "error": f"Could not open file chooser: {exc}"})
                finally:
                    if root is not None:
                        root.destroy()
                return

            if parsed.path == "/api/cancel":
                with lock:
                    proc = render_process
                    state = read_render_state()
                    state_pid = state.get("pid")
                    output_to_remove = render_output or state.get("output")
                    running = (proc is not None and proc.poll() is None) or pid_is_running(state_pid)
                    if not running:
                        if render_log_handle:
                            render_log_handle.close()
                            render_log_handle = None
                        clear_render_state()
                        write_json(self, 200, {"ok": True, "message": "\u6ca1\u6709\u6b63\u5728\u8fd0\u884c\u7684\u5bfc\u51fa\u4efb\u52a1\u3002"})
                        return
                    terminate_process_tree(proc, state_pid)
                    if render_log_handle:
                        render_log_handle.close()
                        render_log_handle = None
                    removed = remove_partial_output(output_to_remove)
                    append_render_log("Render canceled by user.")
                    if removed:
                        append_render_log(f"Partial output cleanup: {removed}")
                    clear_render_state()
                message = "\u5df2\u53d6\u6d88\u5f53\u524d\u5bfc\u51fa\u4efb\u52a1\uff0c\u5e76\u5df2\u505c\u6b62 ffmpeg \u5b50\u8fdb\u7a0b\u3002"
                if removed:
                    message += f"\n\u5df2\u6e05\u7406\u672a\u5b8c\u6210\u8f93\u51fa\uff1a{removed}"
                write_json(self, 200, {"ok": True, "message": message})
                return
            if parsed.path == "/api/render":
                xml = payload.get("xml") or "<layout>\n</layout>\n"
                target = EMPTY_LAYOUT_PATH if payload.get("mode") == "clean" else LAYOUT_PATH
                target.write_text(xml, encoding="utf-8")

                with lock:
                    if render_process is not None and render_process.poll() is None:
                        write_json(self, 409, {"ok": False, "error": "A render is already running."})
                        return
                    cmd, output_path = build_command(payload)
                    render_env = render_environment(payload)
                    proxy_line = render_env.get("HTTPS_PROXY") or render_env.get("HTTP_PROXY") or "disabled"
                    if render_log_handle:
                        render_log_handle.close()
                        render_log_handle = None
                    archive_current_log()
                    safe_command = redacted_command_line(cmd)
                    LOG_PATH.write_text("Command:\n" + safe_command + "\n\nMap proxy: " + proxy_line + "\n\n", encoding="utf-8")
                    log_handle = LOG_PATH.open("a", encoding="utf-8", errors="replace")
                    render_log_handle = log_handle
                    render_process = subprocess.Popen(
                        cmd,
                        cwd=str(BASE_DIR),
                        stdout=log_handle,
                        stderr=subprocess.STDOUT,
                        text=True,
                        env=render_env,
                        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                    )
                    render_command = safe_command
                    render_output = output_path
                    write_render_state(render_process.pid, output_path)
                    render_started = time.strftime("%Y-%m-%d %H:%M:%S")
                write_json(self, 200, {"ok": True, "pid": render_process.pid, "output": output_path, "log": str(LOG_PATH)})
                return

            if parsed.path == "/api/preview-frame":
                with lock:
                    if render_process is not None and render_process.poll() is None:
                        write_json(self, 409, {"ok": False, "error": "A render is already running. Preview after the export finishes."})
                        return
                xml = payload.get("xml") or "<layout>\n</layout>\n"
                LAYOUT_PATH.write_text(xml, encoding="utf-8")
                cmd = build_preview_command(payload)
                render_env = render_environment(payload)
                proxy_line = render_env.get("HTTPS_PROXY") or render_env.get("HTTP_PROXY") or "disabled"
                PREVIEW_LOG_PATH.write_text("Command:\n" + redacted_command_line(cmd) + "\n\nMap proxy: " + proxy_line + "\n\n", encoding="utf-8")
                result = subprocess.run(
                    cmd,
                    cwd=str(BASE_DIR),
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    env=render_env,
                    timeout=180,
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                )
                PREVIEW_LOG_PATH.write_text(PREVIEW_LOG_PATH.read_text(encoding="utf-8", errors="replace") + result.stdout, encoding="utf-8")
                if result.returncode != 0:
                    write_json(self, 500, {"ok": False, "error": "Preview render failed.", "log": PREVIEW_LOG_PATH.read_text(encoding="utf-8", errors="replace")[-12000:]})
                    return
                write_json(self, 200, {"ok": True, "url": "/api/preview-image?t=" + str(int(time.time())), "path": str(PREVIEW_PATH), "log": PREVIEW_LOG_PATH.read_text(encoding="utf-8", errors="replace")[-12000:]})
                return

            write_json(self, 404, {"ok": False, "error": "Unknown API endpoint"})
        except Exception as exc:
            write_json(self, 500, {"ok": False, "error": str(exc)})


def main():
    ensure_runtime_dirs()
    if not WEB_DIR.exists():
        raise FileNotFoundError(f"Web assets not found: {WEB_DIR}")
    port = pick_port(8765)
    server = ThreadingHTTPServer(("127.0.0.1", port), PanelHandler)
    url = f"http://127.0.0.1:{port}/"
    print(f"Overlay Designer running at {url}")
    print("Keep this PowerShell window open while using one-click render.")
    if os.environ.get("OVERLAY_DESIGNER_NO_BROWSER") != "1":
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    server.serve_forever()


if __name__ == "__main__":
    main()
