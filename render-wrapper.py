import argparse
import os
import subprocess
import sys
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(description="Run dashboard render and apply display rotation without re-encoding")
    parser.add_argument("--ffmpeg-dir", required=True)
    parser.add_argument("--rotation", type=int, default=0)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    return parser.parse_args()


def remux_rotation(ffmpeg_dir, output, rotation):
    ffmpeg = Path(ffmpeg_dir) / ("ffmpeg.exe" if os.name == "nt" else "ffmpeg")
    temporary = output.with_name(f".{output.stem}.rotation-fix{output.suffix}")
    temporary.unlink(missing_ok=True)
    print(f"Applying MP4 display rotation: {rotation} degrees", flush=True)
    result = subprocess.run([
        str(ffmpeg), "-y", "-hide_banner", "-loglevel", "error",
        "-display_rotation", str(rotation), "-i", str(output),
        "-map", "0", "-c", "copy", "-movflags", "faststart", str(temporary),
    ])
    if result.returncode != 0 or not temporary.exists() or temporary.stat().st_size == 0:
        temporary.unlink(missing_ok=True)
        return result.returncode or 1
    os.replace(temporary, output)
    print("Display rotation written to the MP4 container.", flush=True)
    return 0


def main():
    args = parse_args()
    command = args.command[1:] if args.command[:1] == ["--"] else args.command
    if not command:
        raise ValueError("Missing dashboard command")
    result = subprocess.run(command)
    if result.returncode != 0:
        return result.returncode
    rotation = args.rotation % 360
    if rotation and args.output.exists():
        return remux_rotation(args.ffmpeg_dir, args.output, rotation)
    return 0


if __name__ == "__main__":
    sys.exit(main())
