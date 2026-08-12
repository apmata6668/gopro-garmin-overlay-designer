import shutil
import sysconfig
from importlib.metadata import version
from pathlib import Path

import gopro_overlay

SUPPORTED_GOPRO_OVERLAY = "0.134.0"


def require_supported_version():
    installed = version("gopro-overlay")
    if installed != SUPPORTED_GOPRO_OVERLAY:
        raise RuntimeError(
            f"Unsupported gopro-overlay version {installed}; expected {SUPPORTED_GOPRO_OVERLAY}. "
            "Re-run the installer to restore the pinned dependency."
        )


def replace_once(path, old, new, marker):
    text = path.read_text(encoding="utf-8")
    if marker in text:
        return
    if old not in text:
        raise RuntimeError(f"Could not patch {path}: insertion point not found")
    backup = path.with_suffix(path.suffix + ".overlay-designer.bak")
    if not backup.exists():
        shutil.copy2(path, backup)
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


def installed_dashboard_script():
    scripts_dir = Path(sysconfig.get_path("scripts"))
    candidates = [scripts_dir / "gopro-dashboard.py", scripts_dir / "gopro-dashboard"]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    expected = ", ".join(str(path) for path in candidates)
    raise FileNotFoundError(f"Could not locate the installed gopro-dashboard entry point; checked: {expected}")


def main():
    require_supported_version()
    root = Path(__file__).resolve().parent
    package_dir = Path(gopro_overlay.__file__).resolve().parent
    shutil.copy2(root / "gps_alignment.py", package_dir / "gps_alignment.py")

    arguments = package_dir / "arguments.py"
    only_group = '''    only = parser.add_argument_group("GPX Only", "Creating Movies from GPX File only")
'''
    gps_sync_argument = '''    gpx.add_argument("--gps-sync", choices=["time", "position"], default="time",
                     help="Align Garmin data by device timestamps or by matching the GoPro and Garmin GPS tracks")

'''
    replace_once(arguments, only_group, gps_sync_argument + only_group, "--gps-sync")

    compare_argument = '''    gpx.add_argument("--gpx-compare", action="store_true",
                     help="Keep Garmin GPS metrics as garmin_speed/garmin_alt/garmin_odo while preserving GoPro GPS metrics")

'''
    replace_once(arguments, gps_sync_argument, compare_argument + gps_sync_argument, "--gpx-compare")

    frame_meta_gpx = package_dir / "framemeta_gpx.py"
    frame_meta_anchor = '''def timeseries_to_framemeta(gpx_timeseries: Timeseries, units, start_date: datetime.datetime = None,
'''
    compare_function = '''def add_gpx_compare_metrics(gpx_timeseries: Timeseries, gopro_framemeta: FrameMeta):
    compare_keys = {
        "speed": "garmin_speed",
        "alt": "garmin_alt",
        "odo": "garmin_odo",
        "dist": "garmin_dist",
    }

    def processor(gopro_entry: Entry):
        try:
            gpx_entry = gpx_timeseries.get(gopro_entry.dt)
        except ValueError:
            return None

        updates = {}
        for source_key, target_key in compare_keys.items():
            value = gpx_entry.items.get(source_key)
            if value is not None:
                updates[target_key] = value
        return updates

    gopro_framemeta.process(processor)


'''
    replace_once(
        frame_meta_gpx,
        frame_meta_anchor,
        compare_function + frame_meta_anchor,
        "def add_gpx_compare_metrics",
    )

    dashboard = installed_dashboard_script()
    import_anchor = "from gopro_overlay.framemeta_gpx import merge_gpx_with_gopro, timeseries_to_framemeta\n"
    replacement_import = (
        "from gopro_overlay.framemeta_gpx import add_gpx_compare_metrics, "
        "merge_gpx_with_gopro, timeseries_to_framemeta\n"
        "from gopro_overlay.gps_alignment import align_timeseries_by_position\n"
    )
    replace_once(
        dashboard,
        import_anchor,
        replacement_import,
        "from gopro_overlay.gps_alignment import align_timeseries_by_position",
    )

    function_anchor = '''def fmtdt(dt: datetime.datetime):
'''
    function_replacement = '''def layout_uses_garmin_compare(layout_xml: Path) -> bool:
    if not layout_xml:
        return False
    try:
        xml = load_xml_layout(layout_xml)
    except Exception as exc:
        log(f"Could not inspect layout for Garmin compare metrics: {exc}")
        return False
    return any(metric in xml for metric in ("garmin_speed", "garmin_alt", "garmin_odo", "garmin_dist"))


def fmtdt(dt: datetime.datetime):
'''
    replace_once(
        dashboard,
        function_anchor,
        function_replacement,
        "def layout_uses_garmin_compare",
    )

    merge_anchor = '''                        fit_or_gpx_timeseries = load_external(external_file, units)
                        log(f"GPX/FIT file:     {fmtdt(fit_or_gpx_timeseries.min)} -> {fmtdt(fit_or_gpx_timeseries.max)}")
                        overlap = DateRange(start=frame_meta.date_at(frame_meta.min),
'''
    merge_replacement = '''                        fit_or_gpx_timeseries = load_external(external_file, units)
                        log(f"GPX/FIT file:     {fmtdt(fit_or_gpx_timeseries.min)} -> {fmtdt(fit_or_gpx_timeseries.max)}")
                        if getattr(args, "gps_sync", "time") == "position":
                            alignment = align_timeseries_by_position(fit_or_gpx_timeseries, frame_meta)
                            fit_or_gpx_timeseries = alignment.timeseries
                            log(
                                "GPS position sync: "
                                f"Garmin-GoPro offset {alignment.offset_seconds:+.1f}s, "
                                f"median error {alignment.median_error_m:.1f}m, "
                                f"p80 {alignment.p80_error_m:.1f}m, "
                                f"samples {alignment.samples}"
                            )
                        overlap = DateRange(start=frame_meta.date_at(frame_meta.min),
'''
    replace_once(
        dashboard,
        merge_anchor,
        merge_replacement,
        "GPS position sync:",
    )

    compare_merge_anchor = '''                        log(f"GPX/FIT Timeseries has {len(fit_or_gpx_timeseries)} data points.. merging...")
                        merge_gpx_with_gopro(fit_or_gpx_timeseries, frame_meta, mode=args.gpx_merge)
'''
    compare_merge_replacement = '''                        log(f"GPX/FIT Timeseries has {len(fit_or_gpx_timeseries)} data points.. merging...")
                        use_gpx_compare = getattr(args, "gpx_compare", False) or layout_uses_garmin_compare(args.layout_xml)
                        if use_gpx_compare:
                            log("Garmin GPS compare metrics enabled")
                            add_gpx_compare_metrics(fit_or_gpx_timeseries, frame_meta)
                        merge_gpx_with_gopro(fit_or_gpx_timeseries, frame_meta, mode=args.gpx_merge)
'''
    replace_once(
        dashboard,
        compare_merge_anchor,
        compare_merge_replacement,
        "Garmin GPS compare metrics enabled",
    )


if __name__ == "__main__":
    main()
