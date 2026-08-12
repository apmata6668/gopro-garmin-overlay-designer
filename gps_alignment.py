from collections import Counter
from dataclasses import dataclass
from datetime import timedelta
from heapq import nsmallest
from math import asin, cos, isfinite, radians, sin, sqrt
from statistics import median

from gopro_overlay.entry import Entry
from gopro_overlay.gpmf import GPS_FIXED_VALUES
from gopro_overlay.timeseries import Timeseries


@dataclass(frozen=True)
class AlignmentResult:
    timeseries: Timeseries
    offset_seconds: float
    median_error_m: float
    p80_error_m: float
    samples: int
    coverage: float


@dataclass(frozen=True)
class _Score:
    value: float
    offset_seconds: float
    median_error_m: float
    p80_error_m: float
    samples: int
    coverage: float


def _has_point(entry, require_lock=False):
    point = getattr(entry, "point", None)
    if point is None:
        return False
    if not all(isfinite(value) for value in (point.lat, point.lon)):
        return False
    if abs(point.lat) > 90 or abs(point.lon) > 180:
        return False
    if require_lock and getattr(entry, "gpsfix", None) not in GPS_FIXED_VALUES:
        return False
    return True


def _distance_m(a, b):
    dlat = radians(b.lat - a.lat)
    dlon = radians(b.lon - a.lon)
    lat_a = radians(a.lat)
    lat_b = radians(b.lat)
    h = sin(dlat / 2) ** 2 + cos(lat_a) * cos(lat_b) * sin(dlon / 2) ** 2
    return 12_742_000 * asin(min(1.0, sqrt(h)))


def _distance_key(a, b):
    mean_lat = radians((a.lat + b.lat) / 2)
    return (a.lat - b.lat) ** 2 + ((a.lon - b.lon) * cos(mean_lat)) ** 2


def _even_sample(items, limit):
    if len(items) <= limit:
        return items
    if limit <= 1:
        return [items[0]]
    last = len(items) - 1
    return [items[round(index * last / (limit - 1))] for index in range(limit)]


def _percentile(sorted_values, fraction):
    return sorted_values[round((len(sorted_values) - 1) * fraction)]


def _score_offset(external, gopro_samples, offset_seconds):
    distances = []
    offset = timedelta(seconds=offset_seconds)
    for gopro_entry in gopro_samples:
        try:
            external_entry = external.get(gopro_entry.dt + offset)
        except ValueError:
            continue
        if _has_point(external_entry):
            distances.append(_distance_m(gopro_entry.point, external_entry.point))

    minimum = max(5, round(len(gopro_samples) * 0.65))
    if len(distances) < minimum:
        return None

    distances.sort()
    coverage = len(distances) / len(gopro_samples)
    median_error = median(distances)
    p80_error = _percentile(distances, 0.8)
    value = median_error + 0.35 * p80_error + (1.0 - coverage) * 80
    return _Score(value, offset_seconds, median_error, p80_error, len(distances), coverage)


def align_timeseries_by_position(external, gopro_framemeta):
    gopro_samples = [
        entry
        for entry in gopro_framemeta.items(step=timedelta(seconds=2))
        if _has_point(entry, require_lock=True)
    ]
    if len(gopro_samples) < 6:
        gopro_samples = [
            entry for entry in gopro_framemeta.items() if _has_point(entry, require_lock=True)
        ]
    gopro_samples = _even_sample(gopro_samples, 200)

    external_samples = [entry for entry in external.items() if _has_point(entry)]
    external_samples = _even_sample(external_samples, 5000)

    if len(gopro_samples) < 6:
        raise ValueError("GPS position sync needs at least six valid GoPro GPS samples")
    if len(external_samples) < 6:
        raise ValueError("GPS position sync needs at least six valid Garmin GPS samples")

    movement = max(_distance_m(gopro_samples[0].point, entry.point) for entry in gopro_samples)
    if movement < 30:
        raise ValueError(
            "GoPro GPS track is too short or stationary for reliable position sync; use time sync"
        )

    candidate_counts = Counter()
    for gopro_entry in gopro_samples:
        nearest = nsmallest(
            5,
            external_samples,
            key=lambda external_entry: _distance_key(gopro_entry.point, external_entry.point),
        )
        for external_entry in nearest:
            delta = (external_entry.dt - gopro_entry.dt).total_seconds()
            candidate_counts[round(delta)] += 1

    start_delta = round((external.min - gopro_samples[0].dt).total_seconds())
    candidate_counts[start_delta] += 1
    candidate_counts[0] += 1

    rough_scores = []
    for offset_seconds, _ in candidate_counts.most_common(120):
        score = _score_offset(external, gopro_samples, offset_seconds)
        if score is not None:
            rough_scores.append(score)
    rough_scores.sort(key=lambda score: score.value)

    if not rough_scores:
        raise ValueError("Could not find enough overlapping GPS positions for position sync")

    refined_scores = []
    tested = set()
    for rough in rough_scores[:5]:
        for tenth in range(-15, 16):
            offset_seconds = round(rough.offset_seconds + tenth / 10, 1)
            if offset_seconds in tested:
                continue
            tested.add(offset_seconds)
            score = _score_offset(external, gopro_samples, offset_seconds)
            if score is not None:
                refined_scores.append(score)
    refined_scores.sort(key=lambda score: score.value)
    best = refined_scores[0] if refined_scores else rough_scores[0]

    if best.median_error_m > 120 or best.p80_error_m > 250:
        raise ValueError(
            "GPS tracks do not match closely enough for position sync "
            f"(median {best.median_error_m:.1f} m, p80 {best.p80_error_m:.1f} m)"
        )

    duration_seconds = max(
        1.0, (gopro_samples[-1].dt - gopro_samples[0].dt).total_seconds()
    )
    separation = max(15.0, duration_seconds * 0.5)
    ambiguous = [
        score
        for score in rough_scores
        if abs(score.offset_seconds - best.offset_seconds) > separation
        and score.value <= best.value * 1.08
    ]
    if ambiguous:
        raise ValueError(
            "GPS position sync found multiple equally likely route matches; use time sync"
        )

    offset = timedelta(seconds=best.offset_seconds)
    shifted = Timeseries(
        Entry(entry.dt - offset, **entry.items) for entry in external.items()
    )
    return AlignmentResult(
        timeseries=shifted,
        offset_seconds=best.offset_seconds,
        median_error_m=best.median_error_m,
        p80_error_m=best.p80_error_m,
        samples=best.samples,
        coverage=best.coverage,
    )
