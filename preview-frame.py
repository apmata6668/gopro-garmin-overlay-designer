import argparse
import os
import sys
from pathlib import Path

from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
SITE_PACKAGES = BASE_DIR / "venv" / "Lib" / "site-packages"
if SITE_PACKAGES.exists():
    sys.path.insert(0, str(SITE_PACKAGES))

os.environ.setdefault("NO_PROXY", "localhost,127.0.0.1")
os.environ.setdefault("no_proxy", "localhost,127.0.0.1")

from gopro_overlay import gpmd_filters, timeseries_process
from gopro_overlay.config import Config
from gopro_overlay.counter import ReasonCounter
from gopro_overlay.date_overlap import DateRange
from gopro_overlay.dimensions import dimension_from
from gopro_overlay.ffmpeg import FFMPEG
from gopro_overlay.ffmpeg_gopro import FFMPEGGoPro
from gopro_overlay.font import load_font
from gopro_overlay.framemeta_gpmd import LoadFlag
from gopro_overlay.framemeta_gpx import add_gpx_compare_metrics, merge_gpx_with_gopro
from gopro_overlay.gps_alignment import align_timeseries_by_position
from gopro_overlay.geo import MapRenderer, MapStyler, api_key_finder
from gopro_overlay.gpmf import GPS_FIXED_VALUES, GPSFix
from gopro_overlay.layout import Overlay
from gopro_overlay.layout_xml import Converters, layout_from_xml, load_xml_layout
from gopro_overlay.loading import GoproLoader, load_external
from gopro_overlay.point import Point
from gopro_overlay.privacy import NoPrivacyZone, PrivacyZone
from gopro_overlay.timeunits import timeunits
from gopro_overlay.units import units


def parse_args():
    parser = argparse.ArgumentParser(description="Render one dashboard overlay preview PNG")
    parser.add_argument("--font", default="trebuc.ttf")
    parser.add_argument("--ffmpeg-dir")
    parser.add_argument("--config-dir", type=Path, default=Path(os.environ.get("LOCALAPPDATA") or BASE_DIR / ".local") / "OverlayDesigner" / "config")
    parser.add_argument("--map-style", default="cyclosm")
    parser.add_argument("--map-api-key")
    parser.add_argument("--cache-dir", type=Path, default=BASE_DIR / "map-cache")
    parser.add_argument("--fit", "--gpx", dest="gpx")
    parser.add_argument("--gpx-merge", choices=["EXTEND", "OVERWRITE"], default="EXTEND")
    parser.add_argument("--gpx-compare", action="store_true")
    parser.add_argument("--gps-sync", choices=["time", "position"], default="time")
    parser.add_argument("--load", nargs="+", choices=[flag.name for flag in LoadFlag], default=[])
    parser.add_argument("--layout-xml", type=Path, required=True)
    parser.add_argument("--overlay-size", default="1920x1080")
    parser.add_argument("--units-speed", default="kph")
    parser.add_argument("--units-altitude", default="metre")
    parser.add_argument("--units-distance", default="mile")
    parser.add_argument("--units-temperature", default="degC")
    parser.add_argument("--privacy")
    parser.add_argument("--gps-dop-max", type=float, default=10)
    parser.add_argument("--gps-speed-max", type=float, default=60)
    parser.add_argument("--gps-speed-max-units", default="kph")
    parser.add_argument("--gps-bbox-lon-lat")
    parser.add_argument("--at", type=float, default=0.0)
    parser.add_argument("input")
    parser.add_argument("output", type=Path)
    return parser.parse_args()


def layout_uses_garmin_compare(layout_xml: Path) -> bool:
    try:
        xml = load_xml_layout(layout_xml)
    except Exception:
        return False
    return any(metric in xml for metric in ("garmin_speed", "garmin_alt", "garmin_odo", "garmin_dist"))


def create_layout(layout_xml, renderer, timeseries, font, privacy_zone, converters):
    return layout_from_xml(
        load_xml_layout(layout_xml),
        renderer,
        timeseries,
        font,
        privacy_zone,
        converters=converters,
    )


def process_frame_meta(frame_meta, packets_per_second):
    locked_2d = lambda e: e.gpsfix in GPS_FIXED_VALUES
    locked_3d = lambda e: e.gpsfix == GPSFix.LOCK_3D.value
    frame_meta.process(timeseries_process.process_ses("point", lambda i: i.point, alpha=0.45), filter_fn=locked_2d)
    frame_meta.process_deltas(timeseries_process.calculate_speeds(), skip=packets_per_second * 3, filter_fn=locked_2d)
    frame_meta.process(timeseries_process.calculate_odo(), filter_fn=locked_2d)
    frame_meta.process_accel(timeseries_process.calculate_accel(), skip=18 * 3)
    frame_meta.process_deltas(timeseries_process.calculate_gradient(), skip=packets_per_second * 3, filter_fn=locked_3d)
    frame_meta.process(timeseries_process.process_kalman("speed", lambda e: e.speed))
    frame_meta.process(timeseries_process.filter_locked())


def main():
    args = parse_args()
    args.cache_dir.mkdir(exist_ok=True)
    args.config_dir.mkdir(parents=True, exist_ok=True)
    config_loader = Config(args.config_dir)

    ffmpeg = FFMPEG(location=Path(args.ffmpeg_dir) if args.ffmpeg_dir else None)
    loader = GoproLoader(
        ffmpeg_gopro=FFMPEGGoPro(ffmpeg),
        units=units,
        flags={LoadFlag[name] for name in args.load},
        gps_lock_filter=gpmd_filters.standard(
            dop_max=args.gps_dop_max,
            speed_max=units.Quantity(args.gps_speed_max, args.gps_speed_max_units),
            bbox=args.gps_bbox_lon_lat,
            report=ReasonCounter().because,
        ),
    )
    gopro = loader.load(Path(args.input))
    frame_meta = gopro.framemeta
    packets_per_second = frame_meta.packets_per_second()

    if args.gpx:
        external = load_external(Path(args.gpx), units)
        if args.gps_sync == "position":
            alignment = align_timeseries_by_position(external, frame_meta)
            external = alignment.timeseries
            print(
                "GPS position sync: "
                f"Garmin-GoPro offset {alignment.offset_seconds:+.1f}s, "
                f"median error {alignment.median_error_m:.1f}m, "
                f"p80 {alignment.p80_error_m:.1f}m, "
                f"samples {alignment.samples}"
            )
        overlap = DateRange(start=frame_meta.date_at(frame_meta.min), end=frame_meta.date_at(frame_meta.max)).overlap_seconds(
            DateRange(start=external.min, end=external.max)
        )
        if overlap == 0:
            raise RuntimeError("Video file and GPX/FIT file do not overlap in time")
        if args.gpx_compare or layout_uses_garmin_compare(args.layout_xml):
            add_gpx_compare_metrics(external, frame_meta)
        merge_gpx_with_gopro(external, frame_meta, mode=args.gpx_merge)

    dimensions = dimension_from(args.overlay_size)
    process_frame_meta(frame_meta, packets_per_second)

    if args.privacy:
        lat, lon, km = args.privacy.split(",")
        privacy_zone = PrivacyZone(Point(float(lat), float(lon)), units.Quantity(float(km), units.km))
    else:
        privacy_zone = NoPrivacyZone()

    converters = Converters(
        speed_unit=args.units_speed,
        distance_unit=args.units_distance,
        altitude_unit=args.units_altitude,
        temperature_unit=args.units_temperature,
    )

    with MapRenderer(cache_dir=args.cache_dir, styler=MapStyler(api_key_finder=api_key_finder(config_loader, args))).open(args.map_style) as renderer:
        font = load_font(args.font)
        layout_creator = create_layout(args.layout_xml, renderer, frame_meta, font, privacy_zone, converters)
        overlay = Overlay(framemeta=frame_meta, create_widgets=layout_creator)
        at_seconds = max(0.0, args.at)
        pts = frame_meta.min + timeunits(seconds=at_seconds)
        image = Image.new("RGBA", dimensions.tuple(), (0, 0, 0, 0))
        overlay.draw(pts, image)
        args.output.parent.mkdir(exist_ok=True)
        image.save(args.output)
        print(args.output)


if __name__ == "__main__":
    main()
