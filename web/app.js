const widgetTemplates = [
  { type: "speed", title: "\u901f\u5ea6", metric: "speed", units: "speed", value: "32", unitText: "km/h", xml: "metric" },
  { type: "gopro_speed", title: "GoPro\u901f\u5ea6", metric: "speed", units: "speed", value: "31", unitText: "km/h", xml: "metric" },
  { type: "garmin_speed", title: "Garmin\u901f\u5ea6", metric: "garmin_speed", units: "speed", value: "32", unitText: "km/h", xml: "metric" },
  { type: "hr", title: "\u5fc3\u7387", metric: "hr", value: "148", unitText: "BPM", xml: "metric" },
  { type: "cadence", title: "\u8e0f\u9891", metric: "cadence", value: "86", unitText: "RPM", xml: "metric" },
  { type: "power", title: "\u529f\u7387", metric: "power", value: "221", unitText: "W", xml: "metric" },
  { type: "alt", title: "\u6d77\u62d4", metric: "alt", units: "alt", value: "426", unitText: "m", xml: "metric" },
  { type: "gopro_alt", title: "GoPro\u6d77\u62d4", metric: "alt", units: "alt", value: "424", unitText: "m", xml: "metric" },
  { type: "garmin_alt", title: "Garmin\u6d77\u62d4", metric: "garmin_alt", units: "alt", value: "426", unitText: "m", xml: "metric" },
  { type: "gradient", title: "\u5761\u5ea6", metric: "gradient", value: "4", unitText: "%", xml: "metric" },
  { type: "distance", title: "\u8ddd\u79bb", metric: "odo", units: "distance", value: "12.8", unitText: "km", xml: "metric" },
  { type: "gopro_distance", title: "GoPro\u8ddd\u79bb", metric: "odo", units: "distance", value: "12.7", unitText: "km", xml: "metric" },
  { type: "garmin_distance", title: "Garmin\u8ddd\u79bb", metric: "garmin_odo", units: "distance", value: "12.8", unitText: "km", xml: "metric" },
  { type: "temp", title: "\u6e29\u5ea6", metric: "temp", units: "temp", value: "24", unitText: "C", xml: "metric" },
  { type: "datetime", title: "\u65f6\u95f4", value: "14:28:09", unitText: "", xml: "datetime" },
  { type: "gps", title: "GPS", value: "31.2304, 121.4737", unitText: "", xml: "gps" },
  { type: "moving_map", title: "\u52a8\u6001\u5730\u56fe", value: "MAP", unitText: "", xml: "moving_map", className: "map" },
  { type: "journey_map", title: "\u8f68\u8ff9\u5730\u56fe", value: "ROUTE", unitText: "", xml: "journey_map", className: "map" },
  { type: "compass", title: "\u6307\u5357\u9488", value: "NE", unitText: "", xml: "compass" },
  { type: "chart", title: "\u6d77\u62d4\u66f2\u7ebf", value: "ALT", unitText: "", xml: "chart", className: "chart" },
  { type: "accel", title: "\u52a0\u901f\u5ea6", metric: "accel", value: "0.4", unitText: "G", xml: "metric" },
  { type: "imu_accel", title: "GoPro\u4e09\u8f74G\u529b", value: "X +0.13  Y -0.74  Z -0.58", unitText: "G", xml: "imu_accel", className: "imu", group: "imu" },
  { type: "imu_gravity", title: "GoPro\u91cd\u529b\u65b9\u5411", value: "X +0.02  Y -0.78  Z -0.62", unitText: "", xml: "imu_gravity", className: "imu", group: "imu" },
  { type: "imu_orientation", title: "GoPro\u59ff\u6001\u89d2", value: "P -8.4  R +2.1  Y +31.6", unitText: "DEG", xml: "imu_orientation", className: "imu", group: "imu" }
];

const IMU_WIDGET_TYPES = ["imu_accel", "imu_gravity", "imu_orientation"];
const MERGE_MODES = [
  { value: "OPTIMIZED", label: "\u4f18\u5316\u6df7\u5408\uff1aGoPro \u901f\u5ea6/\u52a0\u901f\u5ea6 + Garmin \u5fc3\u7387/\u6d77\u62d4" },
  { value: "EXTEND", label: "GoPro \u4e3b\u6570\u636e + Garmin \u5fc3\u7387/\u8e0f\u9891/\u529f\u7387" },
  { value: "OVERWRITE", label: "Garmin GPS/\u901f\u5ea6/\u6d77\u62d4\u4f18\u5148" },
  { value: "COMPARE", label: "\u53cc GPS \u72ec\u7acb\u5bf9\u6bd4" },
  { value: "GOPRO_ONLY", label: "\u4ec5 GoPro \u89c6\u9891\u5185\u7f6e\u6570\u636e" }
];

const state = {
  mode: "burn",
  selectedId: null,
  widgets: [],
  officialXml: null,
  officialPreview: [],
  previewFrameUrl: null,
  canvasSize: null
};

const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

const elements = {
  stage: document.getElementById("stage"),
  palette: document.getElementById("widgetPalette"),
  xmlOutput: document.getElementById("xmlOutput"),
  commandOutput: document.getElementById("commandOutput"),
  renderStatus: document.getElementById("renderStatus"),
  progressLabel: document.getElementById("progressLabel"),
  progressPercent: document.getElementById("progressPercent"),
  progressFill: document.getElementById("progressFill"),
  progressDetail: document.getElementById("progressDetail"),
  videoPath: document.getElementById("videoPath"),
  outputPath: document.getElementById("outputPath"),
  outputFolder: document.getElementById("outputFolder"),
  outputName: document.getElementById("outputName"),
  dataPath: document.getElementById("dataPath"),
  useExternalData: document.getElementById("useExternalData"),
  ffmpegDir: document.getElementById("ffmpegDir"),
  overlayFont: document.getElementById("overlayFont"),
  mapStyle: document.getElementById("mapStyle"),
  mapApiKey: document.getElementById("mapApiKey"),
  themeSelect: document.getElementById("themeSelect"),
  encoderProfile: document.getElementById("encoderProfile"),
  useMapProxy: document.getElementById("useMapProxy"),
  mapProxy: document.getElementById("mapProxy"),
  layoutPreset: document.getElementById("layoutPreset"),
  useGoproGps: document.getElementById("useGoproGps"),
  useGoproImu: document.getElementById("useGoproImu"),
  imuOptions: document.getElementById("imuOptions"),
  compareGps: document.getElementById("compareGps"),
  gpsSync: document.getElementById("gpsSync"),
  canvasWidth: document.getElementById("canvasWidth"),
  canvasHeight: document.getElementById("canvasHeight"),
  speedUnit: document.getElementById("speedUnit"),
  altUnit: document.getElementById("altUnit"),
  mergeMode: document.getElementById("mergeMode"),
  selectionControls: document.getElementById("selectionControls"),
  emptySelection: document.getElementById("emptySelection"),
  widgetName: document.getElementById("widgetName"),
  widgetX: document.getElementById("widgetX"),
  widgetY: document.getElementById("widgetY"),
  widgetScale: document.getElementById("widgetScale"),
  widgetVisible: document.getElementById("widgetVisible"),
  hiddenWidgets: document.getElementById("hiddenWidgets"),
  presetFile: document.getElementById("presetFile"),
  hardwareStatus: document.getElementById("hardwareStatus"),
  settingsSaveState: document.getElementById("settingsSaveState")
};

function nextId() {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function currentSize() {
  return {
    width: Math.max(320, Number(elements.canvasWidth.value) || BASE_WIDTH),
    height: Math.max(180, Number(elements.canvasHeight.value) || BASE_HEIGHT)
  };
}

function outputScale() {
  const size = currentSize();
  return Math.min(size.width / BASE_WIDTH, size.height / BASE_HEIGHT);
}

function scaled(value) {
  return Math.round(value * outputScale());
}

function scaledAtScale(value, itemScale) {
  return Math.round(value * itemScale / 100 * outputScale());
}

function scaleToStage(x, axis) {
  const size = currentSize();
  const rect = elements.stage.getBoundingClientRect();
  return axis === "x" ? x / size.width * rect.width : x / size.height * rect.height;
}

function scaleFromStage(x, axis) {
  const size = currentSize();
  const rect = elements.stage.getBoundingClientRect();
  return Math.round(axis === "x" ? x / rect.width * size.width : x / rect.height * size.height);
}

function templateByType(type) {
  return widgetTemplates.find((item) => item.type === type);
}

function createWidget(type, x = 80, y = 80, scale = 100) {
  const item = {
    id: nextId(),
    type,
    name: uniqueName(type),
    x,
    y,
    scale,
    visible: true
  };
  state.widgets.push(item);
  state.selectedId = item.id;
  return item;
}

function defaultWidgetSettings(type) {
  const defaults = {
    speed: { x: 42, y: 790, scale: 150 },
    gopro_speed: { x: 42, y: 720, scale: 115 },
    garmin_speed: { x: 300, y: 720, scale: 115 },
    hr: { x: 1640, y: 820, scale: 105 },
    cadence: { x: 1640, y: 900, scale: 105 },
    power: { x: 1640, y: 980, scale: 105 },
    alt: { x: 42, y: 972, scale: 105 },
    gopro_alt: { x: 42, y: 860, scale: 105 },
    garmin_alt: { x: 300, y: 860, scale: 105 },
    gradient: { x: 260, y: 972, scale: 105 },
    distance: { x: 420, y: 840, scale: 100 },
    gopro_distance: { x: 42, y: 980, scale: 105 },
    garmin_distance: { x: 300, y: 980, scale: 105 },
    temp: { x: 1640, y: 740, scale: 100 },
    datetime: { x: 42, y: 36, scale: 100 },
    gps: { x: 1320, y: 36, scale: 95 },
    moving_map: { x: 1624, y: 92, scale: 100 },
    journey_map: { x: 1624, y: 380, scale: 100 },
    compass: { x: 1320, y: 780, scale: 95 },
    chart: { x: 510, y: 966, scale: 100 },
    accel: { x: 1320, y: 900, scale: 95 },
    imu_accel: { x: 60, y: 300, scale: 75 },
    imu_gravity: { x: 700, y: 300, scale: 75 },
    imu_orientation: { x: 1340, y: 300, scale: 75 }
  };
  return defaults[type] || { x: 96, y: 96, scale: 100 };
}

function ensureWidget(type) {
  let widget = state.widgets.find((item) => item.type === type);
  if (!widget) {
    const settings = defaultWidgetSettings(type);
    widget = createWidget(type, settings.x, settings.y, settings.scale);
  }
  widget.visible = true;
  state.selectedId = widget.id;
  return widget;
}

function setWidgetTypeVisible(type, visible) {
  if (visible && IMU_WIDGET_TYPES.includes(type) && elements.useGoproImu) {
    elements.useGoproImu.checked = true;
  }
  const widget = visible ? ensureWidget(type) : state.widgets.find((item) => item.type === type && item.visible);
  if (!widget) return;
  widget.visible = visible;
  if (!visible && state.selectedId === widget.id) {
    state.selectedId = null;
  }
  render();
}

function uniqueName(type) {
  const base = type.replace(/[^a-z0-9_]/gi, "_");
  let index = 1;
  let name = base;
  const existing = new Set(state.widgets.map((item) => item.name));
  while (existing.has(name)) {
    index += 1;
    name = `${base}_${index}`;
  }
  return name;
}

function renderPalette() {
  elements.palette.innerHTML = "";
  widgetTemplates.filter((template) => template.group !== "imu").forEach((template) => {
    const row = document.createElement("label");
    row.className = "palette-toggle";
    row.title = template.title;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.widgets.some((item) => item.type === template.type && item.visible);
    checkbox.addEventListener("change", () => setWidgetTypeVisible(template.type, checkbox.checked));

    const text = document.createElement("span");
    text.textContent = template.title;

    row.appendChild(checkbox);
    row.appendChild(text);
    elements.palette.appendChild(row);
  });
}

function renderImuOptions() {
  const enabled = Boolean(elements.useGoproImu?.checked);
  elements.imuOptions?.classList.toggle("hidden", !enabled);
  document.querySelectorAll("[data-imu-widget]").forEach((checkbox) => {
    checkbox.checked = state.widgets.some((item) => item.type === checkbox.dataset.imuWidget && item.visible);
  });
}

function renderStage() {
  elements.stage.querySelectorAll(".widget, .official-widget, .preview-frame").forEach((node) => node.remove());
  const previewButton = document.getElementById("previewFrame");
  if (state.previewFrameUrl) {
    const image = document.createElement("img");
    image.className = "preview-frame";
    image.src = state.previewFrameUrl;
    image.alt = "真实渲染预览";
    elements.stage.appendChild(image);
    if (previewButton) previewButton.textContent = "返回编辑";
    return;
  }
  if (previewButton) previewButton.textContent = "真实预览";
  if (state.officialXml) {
    renderOfficialStage();
  }
  state.widgets.forEach((item) => {
    if (!item.visible) return;
    const template = templateByType(item.type);
    const node = document.createElement("div");
    node.className = `widget ${template.className || ""} ${item.id === state.selectedId ? "selected" : ""}`;
    node.dataset.id = item.id;
    node.style.left = `${scaleToStage(item.x, "x")}px`;
    node.style.top = `${scaleToStage(item.y, "y")}px`;
    const geometry = widgetGeometry(template);
    node.style.width = `${Math.max(42, scaleToStage(scaled(geometry.width), "x"))}px`;
    node.style.height = `${Math.max(32, scaleToStage(scaled(geometry.height), "y"))}px`;
    node.style.transform = `scale(${item.scale / 100})`;
    node.innerHTML = widgetPreviewMarkup(template);
    node.addEventListener("pointerdown", startDrag);
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      state.selectedId = item.id;
      render();
    });
    elements.stage.appendChild(node);
  });
}

function widgetGeometry(template) {
  if (template.xml === "moving_map" || template.xml === "journey_map") return { width: 256, height: 256 };
  if (template.xml === "chart") return { width: 520, height: 132 };
  if (template.xml === "compass") return { width: 190, height: 190 };
  if (template.xml === "datetime") return { width: 220, height: 82 };
  if (template.xml === "gps") return { width: 310, height: 112 };
  if (["imu_accel", "imu_gravity", "imu_orientation"].includes(template.xml)) return { width: 330, height: 132 };
  return { width: 176, height: 76 };
}

function widgetPreviewMarkup(template) {
  if (template.group !== "imu") {
    return `<span class="label">${escapeHtml(template.title)}</span><span class="value">${escapeHtml(template.value)}<span class="unit">${escapeHtml(unitLabel(template))}</span></span>`;
  }
  const labels = template.type === "imu_orientation" ? ["P", "R", "Y"] : ["X", "Y", "Z"];
  const values = template.type === "imu_accel" ? ["+0.13", "-0.74", "-0.58"] : template.type === "imu_gravity" ? ["+0.02", "-0.78", "-0.62"] : ["-8.4", "+2.1", "+31.6"];
  const unit = template.type === "imu_accel" ? "G" : template.type === "imu_orientation" ? "DEG" : "";
  return `<span class="label">${escapeHtml(template.title)}</span><span class="imu-readings">${labels.map((label, index) => `<span><small>${label}</small><b>${values[index]}</b><em>${unit}</em></span>`).join("")}</span>`;
}

function renderOfficialStage() {
  state.officialPreview.forEach((item) => {
    if (!item.visible) return;
    const node = document.createElement("div");
    node.className = `official-widget ${item.kind} ${item.id === state.selectedId ? "selected" : ""}`;
    node.dataset.id = item.id;
    node.style.left = `${scaleToStage(item.x, "x")}px`;
    node.style.top = `${scaleToStage(item.y, "y")}px`;
    node.style.width = `${Math.max(44, scaleToStage(item.width, "x"))}px`;
    node.style.height = `${Math.max(32, scaleToStage(item.height, "y"))}px`;
    node.innerHTML = officialPreviewMarkup(item);
    node.addEventListener("pointerdown", startOfficialDrag);
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      state.selectedId = item.id;
      render();
    });
    elements.stage.appendChild(node);
  });
}

function officialPreviewMarkup(item) {
  const type = String(item.type || "").toLowerCase();
  const label = escapeHtml(item.label || item.type || "component");
  if (item.kind === "map") {
    const title = type.includes("journey") ? "ROUTE" : "MAP";
    return `<div class="official-map-grid"><i></i><b>${title}</b><em></em></div>`;
  }
  if (item.kind === "chart") {
    return `<div class="official-chart-line"><span>${label}</span><i></i></div>`;
  }
  if (item.kind === "gauge") {
    return `<div class="official-gauge-dial"><b>${label.slice(0, 3).toUpperCase()}</b><i></i></div>`;
  }
  const reading = sampleOfficialReading(type, item.label);
  return `<div class="official-metric-preview"><span>${label}</span><b>${reading.value}</b><small>${reading.unit}</small></div>`;
}

function sampleOfficialReading(type, label) {
  const text = `${type} ${label}`.toLowerCase();
  if (text.includes("date")) return { value: "2025/11/29", unit: "" };
  if (text.includes("time")) return { value: "14:28:09", unit: "" };
  if (text.includes("speed") || text.includes("mph")) return { value: "32", unit: elements.speedUnit.value === "mph" ? "MPH" : "KM/H" };
  if (text.includes("heart") || text.includes("hr")) return { value: "148", unit: "BPM" };
  if (text.includes("cadence")) return { value: "86", unit: "RPM" };
  if (text.includes("power")) return { value: "221", unit: "W" };
  if (text.includes("alt")) return { value: "426", unit: elements.altUnit.value === "feet" ? "FT" : "M" };
  if (text.includes("temp")) return { value: "24", unit: "C" };
  if (text.includes("gradient")) return { value: "4", unit: "%" };
  if (text.includes("gps")) return { value: "LOCK", unit: "GPS" };
  return { value: "32", unit: "" };
}
function officialById(id) {
  return state.officialPreview.find((item) => item.id === id);
}

function selectedOfficial() {
  return officialById(state.selectedId);
}

function startOfficialDrag(event) {
  const node = event.currentTarget;
  const item = officialById(node.dataset.id);
  if (!item) return;
  state.selectedId = item.id;
  const startX = event.clientX;
  const startY = event.clientY;
  const initialX = item.x;
  const initialY = item.y;
  node.setPointerCapture(event.pointerId);

  function move(moveEvent) {
    const dx = scaleFromStage(moveEvent.clientX - startX, "x");
    const dy = scaleFromStage(moveEvent.clientY - startY, "y");
    const size = currentSize();
    item.x = clamp(initialX + dx, 0, size.width);
    item.y = clamp(initialY + dy, 0, size.height);
    state.officialXml = officialXmlWithPositions();
    render();
  }

  function end() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
}
function parseOfficialLayout(xml) {
  let previewIndex = 0;
  const documentXml = new DOMParser().parseFromString(xml, "application/xml");
  const root = documentXml.querySelector("layout");
  if (!root || documentXml.querySelector("parsererror")) return [];
  const items = [];

  function num(node, attr, fallback = 0) {
    const value = Number(node.getAttribute(attr));
    return Number.isFinite(value) ? value : fallback;
  }

  function kindFor(type) {
    if (type.includes("map")) return "map";
    if (type.includes("chart") || type.includes("bar")) return "chart";
    if (type.includes("compass") || type.includes("gauge") || type.includes("asi") || type.includes("msi")) return "gauge";
    return "metric";
  }

  function sizeFor(node, type) {
    const size = num(node, "size", 0);
    const width = num(node, "width", 0);
    const height = num(node, "height", 0);
    if (width || height) return { width: width || Math.max(120, size), height: height || Math.max(48, size) };
    if (type.includes("map")) return { width: size || 256, height: size || 256 };
    if (type.includes("chart")) return { width: 520, height: 120 };
    if (type.includes("compass") || type.includes("gauge") || type.includes("asi") || type.includes("msi")) return { width: size || 180, height: size || 180 };
    return { width: Math.max(130, size * 3 || 150), height: Math.max(48, size * 1.7 || 64) };
  }

  function labelFor(node, type) {
    return node.getAttribute("name") || node.getAttribute("metric") || type || node.tagName;
  }

  function addItem(node, ox, oy, fallbackType) {
    const type = node.getAttribute("type") || fallbackType || node.tagName;
    const size = sizeFor(node, type);
    items.push({
      id: `official_${previewIndex++}_${Math.random().toString(36).slice(2, 7)}`,
      x: ox + num(node, "x"),
      y: oy + num(node, "y"),
      width: size.width,
      height: size.height,
      type,
      kind: kindFor(type),
      label: labelFor(node, type),
      visible: true
    });
  }

  function walk(node, ox = 0, oy = 0) {
    Array.from(node.children).forEach((child) => {
      const tag = child.tagName;
      const x = ox + num(child, "x");
      const y = oy + num(child, "y");
      if (tag === "component") {
        addItem(child, ox, oy);
        return;
      }
      if (tag === "composite") {
        if (child.getAttribute("name")) {
          addItem(child, ox, oy, "composite");
        } else {
          walk(child, x, y);
        }
        return;
      }
      if (tag === "translate" || tag === "frame") {
        walk(child, x, y);
      }
    });
  }

  walk(root);
  return items;
}

function applyOfficialCanvasSize(preset) {
  const match = preset.match(/(\d{3,4})x(\d{3,4})|_(1080|2160)\b/);
  if (!match) return;
  if (match[1] && match[2]) {
    elements.canvasWidth.value = match[1];
    elements.canvasHeight.value = match[2];
    return;
  }
  if (match[3] === "1080") {
    elements.canvasWidth.value = 1920;
    elements.canvasHeight.value = 1080;
  }
  if (match[3] === "2160") {
    elements.canvasWidth.value = 3840;
    elements.canvasHeight.value = 2160;
  }
}
function unitLabel(template) {
  if (template.units === "speed") return elements.speedUnit.value === "kph" ? "km/h" : elements.speedUnit.value;
  if (template.units === "alt") return elements.altUnit.value === "feet" ? "ft" : "m";
  if (template.units === "distance") return elements.speedUnit.value === "mph" ? "mi" : "km";
  return template.unitText;
}

function startDrag(event) {
  const node = event.currentTarget;
  const widget = state.widgets.find((item) => item.id === node.dataset.id);
  if (!widget) return;
  state.selectedId = widget.id;
  const startX = event.clientX;
  const startY = event.clientY;
  const initialX = widget.x;
  const initialY = widget.y;
  node.setPointerCapture(event.pointerId);

  function move(moveEvent) {
    const dx = scaleFromStage(moveEvent.clientX - startX, "x");
    const dy = scaleFromStage(moveEvent.clientY - startY, "y");
    const size = currentSize();
    widget.x = clamp(initialX + dx, 0, size.width);
    widget.y = clamp(initialY + dy, 0, size.height);
    render();
  }

  function end() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
}

function renderSelection() {
  const selected = state.widgets.find((item) => item.id === state.selectedId);
  const official = selectedOfficial();
  const active = selected || official;
  elements.selectionControls.classList.toggle("hidden", !active);
  elements.emptySelection.classList.toggle("hidden", Boolean(active));
  if (!active) return;
  elements.widgetName.value = selected ? selected.name : official.label;
  elements.widgetX.value = Math.round(active.x);
  elements.widgetY.value = Math.round(active.y);
  elements.widgetScale.value = selected ? selected.scale : 100;
  elements.widgetScale.disabled = Boolean(official);
  elements.widgetVisible.checked = active.visible !== false;
}
function renderHiddenWidgets() {
  const hiddenItems = state.widgets.filter((item) => !item.visible);
  elements.hiddenWidgets.innerHTML = "";
  elements.hiddenWidgets.classList.toggle("hidden", hiddenItems.length === 0);
  if (hiddenItems.length === 0) return;

  const title = document.createElement("div");
  title.className = "hidden-title";
  title.textContent = "\u9690\u85cf\u6d6e\u7a97";
  elements.hiddenWidgets.appendChild(title);

  hiddenItems.forEach((item) => {
    const template = templateByType(item.type);
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${template.title} \u00b7 ${item.name}`;
    button.addEventListener("click", () => {
      item.visible = true;
      state.selectedId = item.id;
      render();
    });
    elements.hiddenWidgets.appendChild(button);
  });
}

function syncDataOptions() {
  const useExternal = elements.useExternalData.checked;
  elements.dataPath.disabled = !useExternal;
  elements.useGoproGps.disabled = !useExternal;
  elements.mergeMode.disabled = false;
  if (!useExternal) {
    elements.useGoproGps.checked = true;
    elements.compareGps.checked = false;
    elements.mergeMode.value = "GOPRO_ONLY";
  }
}

function configureMergeModes() {
  const previous = elements.mergeMode.value || "EXTEND";
  elements.mergeMode.innerHTML = "";
  MERGE_MODES.forEach((mode) => {
    const option = document.createElement("option");
    option.value = mode.value;
    option.textContent = mode.label;
    elements.mergeMode.appendChild(option);
  });
  elements.mergeMode.value = MERGE_MODES.some((mode) => mode.value === previous) ? previous : "EXTEND";
}

function configureEncoderOptions() {
  const cudaOption = elements.encoderProfile?.querySelector('option[value="nnvgpu"]');
  if (cudaOption) cudaOption.textContent = "NVIDIA CUDA \u5168\u6d41\u7a0b\uff08\u81ea\u52a8\u65b9\u5411\u4fee\u6b63\uff09";
  Array.from(elements.encoderProfile?.options || []).forEach((option) => {
    option.dataset.baseLabel = option.textContent;
  });
}

function configureVideoQualityControl() {
  if (document.getElementById("videoBitrate")) return;
  const encoderLabel = elements.encoderProfile?.closest("label");
  if (!encoderLabel) return;
  const label = document.createElement("label");
  label.textContent = "\u5bfc\u51fa\u753b\u8d28 / \u7801\u7387";
  const select = document.createElement("select");
  select.id = "videoBitrate";
  [
    ["100M", "\u539f\u7247\u7ea7 100 Mbps"],
    ["80M", "\u9ad8\u753b\u8d28 80 Mbps\uff08\u63a8\u8350\uff09"],
    ["50M", "\u5e73\u8861 50 Mbps"],
    ["25M", "\u7701\u7a7a\u95f4 25 Mbps"]
  ].forEach(([value, text]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    option.selected = value === "80M";
    select.appendChild(option);
  });
  label.appendChild(select);
  encoderLabel.insertAdjacentElement("afterend", label);
  elements.videoBitrate = select;
  select.addEventListener("change", render);
}

function mapZoomValue() {
  return Math.max(10, Math.min(20, Number(elements.mapZoom?.value) || 16));
}

function applyMapZoomToOfficial() {
  if (!state.officialXml) return;
  const doc = new DOMParser().parseFromString(state.officialXml, "application/xml");
  if (doc.querySelector("parsererror")) return;
  doc.querySelectorAll('component[type="moving_map"]').forEach((node) => node.setAttribute("zoom", String(mapZoomValue())));
  state.officialXml = new XMLSerializer().serializeToString(doc);
}

function configureMapZoomControl() {
  if (document.getElementById("mapZoom")) return;
  const mapLabel = elements.mapStyle?.closest("label");
  if (!mapLabel) return;
  const label = document.createElement("label");
  label.className = "map-zoom-control";
  label.textContent = "\u52a8\u6001\u5730\u56fe\u7f29\u653e";
  const input = document.createElement("input");
  input.id = "mapZoom";
  input.type = "number";
  input.min = "10";
  input.max = "20";
  input.step = "1";
  input.value = "16";
  label.appendChild(input);
  mapLabel.insertAdjacentElement("afterend", label);
  elements.mapZoom = input;
  input.addEventListener("input", () => {
    applyMapZoomToOfficial();
    render();
  });
}

function setOfficialAltitudeSource(useGarmin) {
  if (!state.officialXml) return;
  const doc = new DOMParser().parseFromString(state.officialXml, "application/xml");
  if (doc.querySelector("parsererror")) return;
  const target = useGarmin ? "garmin_alt" : "alt";
  doc.querySelectorAll('[metric="alt"], [metric="garmin_alt"]').forEach((node) => node.setAttribute("metric", target));
  state.officialXml = new XMLSerializer().serializeToString(doc);
  state.officialPreview.forEach((item) => {
    if (item.label === "alt" || item.label === "garmin_alt") item.label = target;
  });
}

function applyMergeMode(mode) {
  if (mode === "OPTIMIZED") {
    elements.useExternalData.checked = true;
    elements.useGoproGps.checked = true;
    elements.compareGps.checked = true;
    setOfficialAltitudeSource(true);
  } else if (mode === "EXTEND") {
    elements.useExternalData.checked = true;
    elements.useGoproGps.checked = true;
    elements.compareGps.checked = false;
    setOfficialAltitudeSource(false);
  } else if (mode === "OVERWRITE") {
    elements.useExternalData.checked = true;
    elements.useGoproGps.checked = false;
    elements.compareGps.checked = false;
    setOfficialAltitudeSource(false);
  } else if (mode === "COMPARE") {
    elements.useExternalData.checked = true;
    elements.useGoproGps.checked = true;
    elements.compareGps.checked = true;
    setOfficialAltitudeSource(false);
    if (!state.officialXml) ensureCompareGpsWidgets();
  } else if (mode === "GOPRO_ONLY") {
    elements.useExternalData.checked = false;
    elements.useGoproGps.checked = true;
    elements.compareGps.checked = false;
    elements.gpsSync.value = "time";
    setOfficialAltitudeSource(false);
  }
  elements.mergeMode.value = mode;
  render();
}

function renderOutput() {
  syncDataOptions();
  if (elements.videoPath.value.trim() !== videoPathValue()) {
    normalizeVideoField();
  }
  if (isBadOutputPath(elements.outputPath.value.trim())) {
    normalizeOutputField();
  }
  elements.xmlOutput.value = buildXml();
  elements.commandOutput.value = buildCommand();
}

function render() {
  state.previewFrameUrl = null;
  renderStage();
  renderPalette();
  renderImuOptions();
  renderSelection();
  renderHiddenWidgets();
  renderOutput();
}

function buildXml() {
  const visibleWidgets = state.mode === "clean" ? [] : state.widgets.filter((item) => item.visible);
  if (state.officialXml && state.mode !== "clean") {
    const baseXml = officialXmlWithPositions().trimEnd();
    if (visibleWidgets.length === 0) return baseXml + "\n";
    const extraLines = visibleWidgets.flatMap((item) => xmlForWidget(item, templateByType(item.type)));
    return baseXml.replace(/\s*<\/layout>\s*$/, "\n" + extraLines.join("\n") + "\n</layout>\n");
  }
  if (visibleWidgets.length === 0) {
    return "<layout>\n</layout>\n";
  }
  const lines = ["<layout>"];
  visibleWidgets.forEach((item) => {
    const template = templateByType(item.type);
    lines.push(...xmlForWidget(item, template));
  });
  lines.push("</layout>");
  return lines.join("\n") + "\n";
}

function officialXmlWithPositions() {
  if (!state.officialXml) return "";
  const doc = new DOMParser().parseFromString(state.officialXml, "application/xml");
  const root = doc.querySelector("layout");
  if (!root || doc.querySelector("parsererror")) return state.officialXml;
  let index = 0;

  function updateNode(node, ox, oy) {
    const item = state.officialPreview[index];
    index += 1;
    if (!item) return;
    if (item.visible === false) {
      node.remove();
      return;
    }
    const currentX = ox + Number(node.getAttribute("x") || 0);
    const currentY = oy + Number(node.getAttribute("y") || 0);
    const dx = Math.round(item.x - currentX);
    const dy = Math.round(item.y - currentY);
    if (dx === 0 && dy === 0) return;

    // Some official components (for example msi2 and bar) do not accept x/y.
    // A translate wrapper can move every component type without changing its schema.
    const wrapper = doc.createElement("translate");
    if (dx !== 0) wrapper.setAttribute("x", String(dx));
    if (dy !== 0) wrapper.setAttribute("y", String(dy));
    node.replaceWith(wrapper);
    wrapper.appendChild(node);
  }

  function walk(node, ox = 0, oy = 0) {
    Array.from(node.children).forEach((child) => {
      const tag = child.tagName;
      if (tag === "component") {
        updateNode(child, ox, oy);
        return;
      }
      if (tag === "composite") {
        if (child.getAttribute("name")) {
          updateNode(child, ox, oy);
        } else {
          walk(child, ox + Number(child.getAttribute("x") || 0), oy + Number(child.getAttribute("y") || 0));
        }
        return;
      }
      if (tag === "translate" || tag === "frame") {
        walk(child, ox + Number(child.getAttribute("x") || 0), oy + Number(child.getAttribute("y") || 0));
      }
    });
  }

  walk(root);
  return new XMLSerializer().serializeToString(doc);
}
function xmlForWidget(item, template) {
  const size = Math.max(scaled(16), scaledAtScale(32, item.scale));
  const labelSize = Math.max(scaled(12), scaledAtScale(14, item.scale));
  const name = xmlEscape(item.name);
  const title = xmlEscape(template.title);
  const geometry = widgetGeometry(template);
  const frameWidth = scaledAtScale(geometry.width, item.scale);
  const frameHeight = scaledAtScale(geometry.height, item.scale);
  const padding = Math.max(scaled(7), scaledAtScale(12, item.scale));
  const radius = Math.max(scaled(5), scaledAtScale(10, item.scale));
  const labelStyle = 'rgb="211,218,215" outline="0,0,0" outline_width="0"';
  const valueStyle = `rgb="255,255,255" outline="0,0,0" outline_width="${Math.max(1, scaledAtScale(1, item.scale))}"`;
  const unitStyle = 'rgb="45,212,191" outline="0,0,0" outline_width="0"';
  const background = (indent = "        ") => `${indent}<frame width="${frameWidth}" height="${frameHeight}" opacity="0.78" cr="${radius}" outline="83,103,96" bg="12,18,16"/>`;

  if (template.xml === "moving_map") {
    const mapSize = Math.max(scaled(128), scaledAtScale(256, item.scale));
    return [
      `    <composite x="${item.x}" y="${item.y}" name="${name}">`,
      `        <frame width="${mapSize}" height="${mapSize}" opacity="0.96" cr="${radius}" outline="83,103,96" bg="12,18,16">`,
      `            <component type="moving_map" x="0" y="0" size="${mapSize}" zoom="${mapZoomValue()}" corner_radius="${radius}"/>`,
      "        </frame>",
      "    </composite>"
    ];
  }

  if (template.xml === "journey_map") {
    const mapSize = Math.max(scaled(128), scaledAtScale(256, item.scale));
    return [
      `    <composite x="${item.x}" y="${item.y}" name="${name}">`,
      `        <frame width="${mapSize}" height="${mapSize}" opacity="0.96" cr="${radius}" outline="83,103,96" bg="12,18,16">`,
      `            <component type="journey_map" x="0" y="0" size="${mapSize}" corner_radius="${radius}"/>`,
      "        </frame>",
      "    </composite>"
    ];
  }

  if (template.xml === "chart") {
    const titleY = Math.max(scaled(4), scaledAtScale(8, item.scale));
    const chartY = scaledAtScale(28, item.scale);
    return [
      `    <composite x="${item.x}" y="${item.y}" name="${name}">`,
      background(),
      `        <component type="text" x="${padding}" y="${titleY}" size="${labelSize}" ${labelStyle}>${title}</component>`,
      `        <component type="chart" x="${padding}" y="${chartY}" width="${Math.max(scaled(120), frameWidth - padding * 2)}" height="${Math.max(scaled(48), frameHeight - chartY - padding)}" units="alt"/>`,
      "    </composite>"
    ];
  }

  if (template.xml === "compass") {
    const compassSize = Math.max(scaled(96), Math.min(frameWidth, frameHeight) - padding * 2);
    return [
      `    <composite x="${item.x}" y="${item.y}" name="${name}">`,
      background(),
      `        <composite x="${padding}" y="${padding}">`,
      `            <component type="compass-arrow" size="${compassSize}" bg="0,0,0,0" arrow="45,212,191" text="255,255,255" textsize="${labelSize}"/>`,
      "        </composite>",
      "    </composite>"
    ];
  }

  if (template.xml === "datetime") {
    return [
      `    <composite x="${item.x}" y="${item.y}" name="${name}">`,
      background(),
      `        <component type="datetime" x="${padding}" y="${padding}" format="%Y/%m/%d" size="${labelSize}" ${labelStyle}/>`,
      `        <component type="datetime" x="${padding}" y="${padding + scaledAtScale(21, item.scale)}" format="%H:%M:%S" size="${size}" ${valueStyle}/>`,
      "    </composite>"
    ];
  }

  if (template.xml === "gps") {
    const row1 = padding + scaledAtScale(26, item.scale);
    const row2 = padding + scaledAtScale(52, item.scale);
    const metricX = padding + scaledAtScale(58, item.scale);
    return [
      `    <composite x="${item.x}" y="${item.y}" name="${name}">`,
      background(),
      `        <component type="text" x="${padding}" y="${padding}" size="${labelSize}" ${labelStyle}>${title}</component>`,
      `        <component type="text" x="${padding}" y="${row1}" size="${labelSize}" ${labelStyle}>LAT</component>`,
      `        <component type="metric" x="${metricX}" y="${row1}" metric="lat" dp="6" size="${labelSize}" cache="False" ${valueStyle}/>`,
      `        <component type="text" x="${padding}" y="${row2}" size="${labelSize}" ${labelStyle}>LON</component>`,
      `        <component type="metric" x="${metricX}" y="${row2}" metric="lon" dp="6" size="${labelSize}" cache="False" ${valueStyle}/>`,
      "    </composite>"
    ];
  }

  if (["imu_accel", "imu_gravity", "imu_orientation"].includes(template.xml)) {
    const metrics = template.xml === "imu_accel"
      ? ["accl.x", "accl.y", "accl.z"]
      : template.xml === "imu_gravity"
        ? ["grav.x", "grav.y", "grav.z"]
        : ["ori.pitch", "ori.roll", "ori.yaw"];
    const axisLabels = template.xml === "imu_orientation" ? ["PITCH", "ROLL", "YAW"] : ["X", "Y", "Z"];
    const metricUnits = template.xml === "imu_accel" ? ' units="G"' : template.xml === "imu_orientation" ? ' units="degree"' : "";
    const unitText = template.xml === "imu_accel" ? "G" : template.xml === "imu_orientation" ? "DEG" : "";
    const valueSize = Math.max(scaled(14), scaledAtScale(24, item.scale));
    const rowGap = scaledAtScale(28, item.scale);
    const metricX = padding + scaledAtScale(76, item.scale);
    const unitX = padding + scaledAtScale(202, item.scale);
    const lines = [
      `    <composite x="${item.x}" y="${item.y}" name="${name}">`,
      background(),
      `        <component type="text" x="${padding}" y="${padding}" size="${labelSize}" ${labelStyle}>${title}</component>`
    ];
    metrics.forEach((metric, index) => {
      const y = padding + scaledAtScale(27, item.scale) + index * rowGap;
      lines.push(`        <component type="text" x="${padding}" y="${y}" size="${labelSize}" ${labelStyle}>${axisLabels[index]}</component>`);
      lines.push(`        <component type="metric" x="${metricX}" y="${y}" metric="${metric}"${metricUnits} dp="2" size="${valueSize}" cache="False" ${valueStyle}/>`);
      if (unitText) lines.push(`        <component type="text" x="${unitX}" y="${y}" size="${labelSize}" ${unitStyle}>${unitText}</component>`);
    });
    lines.push("    </composite>");
    return lines;
  }

  const unitsAttr = template.units ? ` units="${template.units}"` : "";
  const valueY = padding + scaledAtScale(20, item.scale);
  const unitX = padding + scaledAtScale(112, item.scale);
  return [
    `    <composite x="${item.x}" y="${item.y}" name="${name}">`,
    background(),
    `        <component type="text" x="${padding}" y="${padding}" size="${labelSize}" ${labelStyle}>${title}</component>`,
    `        <component type="metric" x="${padding}" y="${valueY}" metric="${template.metric}"${unitsAttr} dp="${template.metric === "gradient" || template.metric === "hr" || template.metric === "cadence" || template.metric === "power" ? "0" : "1"}" size="${size}" ${valueStyle}/>`,
    `        <component type="text" x="${unitX}" y="${padding + scaledAtScale(30, item.scale)}" size="${labelSize}" ${unitStyle}>${xmlEscape(unitLabel(template).toUpperCase())}</component>`,
    "    </composite>"
  ];
}



function repairVideoPath(value) {
  const raw = String(value || "").trim().replaceAll('"', "");
  if (!raw) return "";
  const driveMatches = Array.from(raw.matchAll(/[A-Za-z]:[\\/]/g));
  if (driveMatches.length < 2) return raw;
  const prefix = raw.slice(0, driveMatches[1].index);
  const extMatch = raw.match(/\.(mp4|mov|m4v|avi)$/i);
  if (/\.(mp4|mov|m4v|avi)$/i.test(prefix)) return prefix;
  return extMatch ? prefix + extMatch[0] : prefix;
}

function videoPathValue() {
  return repairVideoPath(elements.videoPath.value.trim()) || "C:\\Videos\\GH010001.MP4";
}

function normalizeVideoField() {
  const fixed = videoPathValue();
  if (elements.videoPath.value.trim() !== fixed) {
    elements.videoPath.value = fixed;
  }
  return fixed;
}

function defaultOutputName() {
  const rawVideo = videoPathValue();
  const fallbackBase = state.mode === "overlay" ? "overlay-only" : state.mode === "clean" ? "clean-dashboard" : "dashboard-output";
  const suffix = state.mode === "overlay" ? "-overlay.mov" : state.mode === "clean" ? "-clean.mp4" : "-overlay.mp4";
  if (!rawVideo) return fallbackBase + (state.mode === "overlay" ? ".mov" : ".mp4");
  const normalized = rawVideo.replaceAll("\\", "/");
  const slash = normalized.lastIndexOf("/");
  const file = normalized.slice(slash + 1);
  const stem = file.replace(/\.[^.]+$/, "") || fallbackBase;
  return stem + suffix;
}

function videoFolderValue() {
  const rawVideo = videoPathValue();
  const slash = Math.max(rawVideo.lastIndexOf("\\"), rawVideo.lastIndexOf("/"));
  return slash >= 0 ? rawVideo.slice(0, slash) : "";
}

function splitOutputPath(path) {
  const value = String(path || "").trim().replaceAll('"', "");
  const slash = Math.max(value.lastIndexOf("\\"), value.lastIndexOf("/"));
  if (slash < 0) return { folder: "", name: value };
  return { folder: value.slice(0, slash), name: value.slice(slash + 1) };
}

function outputFolderValue() {
  return (elements.outputFolder?.value || "").trim() || videoFolderValue();
}

function outputNameValue() {
  const raw = (elements.outputName?.value || elements.outputPath?.value || "").trim();
  const split = splitOutputPath(raw);
  return ensureOutputExtension(split.name || defaultOutputName());
}

function joinOutputPath(folder, name) {
  const cleanName = splitOutputPath(name).name || defaultOutputName();
  const cleanFolder = String(folder || "").trim().replace(/[\\/]$/, "");
  if (!cleanFolder) return cleanName;
  return `${cleanFolder}\\${cleanName}`;
}

function isBadOutputPath(path) {
  const value = String(path || "").trim();
  if (!value) return false;
  if (/[<>|?*]/.test(value)) return true;
  if (/.+[A-Za-z]:[\\/]/.test(value)) return true;
  return value.includes(":") && !/^[A-Za-z]:[\\/]/.test(value);
}

function ensureOutputExtension(path) {
  const value = String(path || "").trim();
  if (!value) return value;
  if (state.mode === "overlay" && /\.[^.\\/]+$/i.test(value)) {
    return value.replace(/\.[^.\\/]+$/i, ".mov");
  }
  if (/\.(mp4|mov|m4v|avi|webm)$/i.test(value)) return value;
  return value + (state.mode === "overlay" ? ".mov" : ".mp4");
}

function outputPathValue() {
  const folder = outputFolderValue();
  const name = outputNameValue();
  const combined = joinOutputPath(folder, name);
  return isBadOutputPath(combined) ? joinOutputPath(videoFolderValue(), defaultOutputName()) : combined;
}

function normalizeOutputField() {
  const fixed = outputPathValue();
  const split = splitOutputPath(fixed);
  if (elements.outputFolder && elements.outputFolder.value.trim() !== split.folder) {
    elements.outputFolder.value = split.folder;
  }
  if (elements.outputName && elements.outputName.value.trim() !== split.name) {
    elements.outputName.value = split.name;
  }
  if (elements.outputPath && elements.outputPath.value.trim() !== fixed) {
    elements.outputPath.value = fixed;
  }
  return fixed;
}

function buildCommand() {
  const videoPath = quotePath(videoPathValue());
  const dataPath = quotePath(elements.dataPath.value.trim() || "C:\\Garmin\\activity.fit");
  const dataFlag = elements.dataPath.value.toLowerCase().endsWith(".fit") ? "--fit" : "--gpx";
  const useExternalData = elements.useExternalData.checked;
  const ffmpegPath = elements.ffmpegDir.value.trim();
  const ffmpegDir = ffmpegPath ? `--ffmpeg-dir ${quotePath(ffmpegPath)}` : "";
  const overlayFont = elements.overlayFont?.value.trim() || "C:\\Windows\\Fonts\\msyh.ttc";
  const configDir = `--config-dir ${quotePath("$env:LOCALAPPDATA\\OverlayDesigner\\config")}`;
  const mapStyle = elements.mapStyle.value || "cyclosm";
  const mapApiKey = elements.mapApiKey?.value.trim() || "";
  const mapApiKeyArg = mapApiKey ? `--map-api-key ${quotePath(mapApiKey)}` : "";
  const encoderProfile = elements.encoderProfile?.value || "cpu";
  const encoderArg = encoderProfile && encoderProfile !== "cpu" ? `--profile ${encoderProfile}` : "";
  const cacheDir = `--cache-dir ${quotePath("$env:LOCALAPPDATA\\OverlayDesigner\\map-cache")}`;
  const mapProxy = normalizeMapProxy(elements.mapProxy?.value || "http://127.0.0.1:10808");
  const proxyPrefix = elements.useMapProxy?.checked && mapProxy ? `$env:HTTP_PROXY=${quotePath(mapProxy)}; $env:HTTPS_PROXY=${quotePath(mapProxy)}; $env:ALL_PROXY=${quotePath(mapProxy)}; ` : "";
  const compareGps = useExternalData && elements.compareGps.checked;
  const imuArg = elements.useGoproImu?.checked ? "--load ACCL GRAV CORI" : "";
  const gpsSync = elements.gpsSync?.value || "time";
  const merge = compareGps || elements.useGoproGps.checked ? "EXTEND" : "OVERWRITE";
  const speed = elements.speedUnit.value;
  const alt = elements.altUnit.value;
  const size = currentSize();
  const outputPath = quotePath(outputPathValue());

  if (state.mode === "clean") {
    return [
      "# \u65e0\u6d6e\u7a97\u8f93\u51fa\uff1a\u4ece\u539f\u59cb\u89c6\u9891\u91cd\u65b0\u5bfc\u51fa/\u590d\u5236\uff0c\u5df2\u7ecf\u70e7\u5f55\u8fdb\u89c6\u9891\u7684\u6d6e\u7a97\u65e0\u6cd5\u771f\u6b63\u62b9\u6389\u3002",
      `ffmpeg -i ${videoPath} -c copy ${outputPath}`,
      "",
      "# \u6216\u8005\u7528\u7a7a XML \u4fdd\u6301\u540c\u4e00\u5957\u6d41\u7a0b\uff1a",
      [`.\\venv\\Scripts\\python.exe .\\venv\\Scripts\\gopro-dashboard.py`, ffmpegDir, `--layout xml`, `--layout-xml "$env:LOCALAPPDATA\\OverlayDesigner\\runtime\\empty-layout.xml"`, videoPath, `"clean-dashboard.mp4"`].filter(Boolean).join(" ")
    ].join("\n");
  }

  const common = [
    `.\\venv\\Scripts\\python.exe .\\venv\\Scripts\\gopro-dashboard.py`,
    `--font ${quotePath(overlayFont)}`,
    useExternalData ? `${dataFlag} ${dataPath}` : "",
    useExternalData ? `--gpx-merge ${merge}` : "",
    compareGps ? `--gpx-compare` : "",
    useExternalData ? `--gps-sync ${gpsSync}` : "",
    ffmpegDir,
    imuArg,
    configDir,
    `--map-style ${mapStyle}`,
    mapApiKeyArg,
    cacheDir,
    `--layout xml`,
    `--layout-xml "$env:LOCALAPPDATA\\OverlayDesigner\\runtime\\my-layout.xml"`,
    `--units-speed ${speed}`,
    `--units-altitude ${alt}`
  ];

  if (state.mode === "overlay") {
    return [
      "# \u900f\u660e\u6d6e\u7a97 MOV\uff1a\u63a8\u8350\u7528\u4e8e\u526a\u8f91\u8f6f\u4ef6\u53e0\u52a0\uff0c\u4e4b\u540e\u5173\u95ed/\u5220\u9664\u8fd9\u6761\u8f68\u9053\u5373\u53ef\u53bb\u6389\u6d6e\u7a97\u3002",
      proxyPrefix + [...common, `--generate overlay`, `--profile mov`, `--overlay-size ${size.width}x${size.height}`, videoPath, outputPath].filter(Boolean).join(" ")
    ].join("\n");
  }

  return [
    "# \u70e7\u5f55\u5230\u89c6\u9891\uff1a\u6d6e\u7a97\u4f1a\u5199\u8fdb\u65b0\u89c6\u9891\uff0c\u4e4b\u540e\u4e0d\u80fd\u4ece\u8fd9\u4e2a\u6210\u7247\u91cc\u65e0\u635f\u79fb\u9664\uff1b\u8bf7\u4fdd\u7559\u539f\u7247\u548c XML\u3002",
    proxyPrefix + [...common, encoderArg, videoPath, outputPath].filter(Boolean).join(" ")
  ].join("\n");
}

function quotePath(path) {
  const clean = path.replaceAll('"', "");
  return `"${clean}"`;
}

function normalizeMapProxy(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^[a-z]+:\/\//i.test(raw)) return raw;
  return `http://${raw}`;
}

function toggleMapApiKeyVisibility() {
  if (!elements.mapApiKey) return;
  const button = document.getElementById("toggleMapApiKey");
  const reveal = elements.mapApiKey.type === "password";
  elements.mapApiKey.type = reveal ? "text" : "password";
  if (button) {
    button.textContent = reveal ? "隐藏" : "显示";
    button.setAttribute("aria-pressed", String(reveal));
  }
}

function collectAppSettings() {
  return {
    ffmpegDir: elements.ffmpegDir?.value || "",
    overlayFont: elements.overlayFont?.value || "",
    mapStyle: elements.mapStyle?.value || "cyclosm",
    mapApiKey: elements.mapApiKey?.value || "",
    mapZoom: elements.mapZoom?.value || "16",
    useMapProxy: elements.useMapProxy?.checked ?? false,
    mapProxy: elements.mapProxy?.value || "",
    encoderProfile: elements.encoderProfile?.value || "cpu",
    videoBitrate: elements.videoBitrate?.value || "80M",
    canvasWidth: elements.canvasWidth?.value || "1920",
    canvasHeight: elements.canvasHeight?.value || "1080",
    speedUnit: elements.speedUnit?.value || "kph",
    altUnit: elements.altUnit?.value || "metre",
    theme: elements.themeSelect?.value || "night"
  };
}

function applyControlValue(control, value) {
  if (!control || value == null) return;
  if (control.type === "checkbox") control.checked = Boolean(value);
  else control.value = String(value);
}

async function loadAppSettings() {
  try {
    const response = await fetch("/api/settings", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    const settings = payload.settings || {};
    applyControlValue(elements.ffmpegDir, settings.ffmpegDir);
    applyControlValue(elements.overlayFont, settings.overlayFont);
    applyControlValue(elements.mapStyle, settings.mapStyle);
    if (payload.hasMapApiKey && elements.mapApiKey) {
      elements.mapApiKey.placeholder = "已保存到本机（留空继续使用）";
    }
    applyControlValue(elements.mapZoom, settings.mapZoom);
    applyControlValue(elements.useMapProxy, settings.useMapProxy);
    applyControlValue(elements.mapProxy, settings.mapProxy);
    applyControlValue(elements.encoderProfile, settings.encoderProfile);
    applyControlValue(elements.videoBitrate, settings.videoBitrate);
    applyControlValue(elements.canvasWidth, settings.canvasWidth);
    applyControlValue(elements.canvasHeight, settings.canvasHeight);
    applyControlValue(elements.speedUnit, settings.speedUnit);
    applyControlValue(elements.altUnit, settings.altUnit);
    if (settings.theme) applyTheme(settings.theme, false);
  } catch (_error) {
    // Defaults remain usable when the local settings file has not been created yet.
  }
}

async function saveAppSettings() {
  if (elements.settingsSaveState) elements.settingsSaveState.textContent = "正在保存...";
  try {
    const result = await postJson("/api/settings", collectAppSettings());
    if (result.hasMapApiKey && elements.mapApiKey) {
      elements.mapApiKey.value = "";
      elements.mapApiKey.placeholder = "已保存到本机（留空继续使用）";
    }
    if (elements.settingsSaveState) elements.settingsSaveState.textContent = "已保存";
  } catch (error) {
    if (elements.settingsSaveState) elements.settingsSaveState.textContent = `保存失败：${String(error.message || error)}`;
  }
}

async function detectHardwareEncoders(force = false) {
  if (!elements.hardwareStatus) return;
  elements.hardwareStatus.textContent = "正在实际试编码 NVENC / QSV / AMF...";
  try {
    const ffmpegDir = elements.ffmpegDir?.value.trim() || "";
    const query = new URLSearchParams({ ffmpegDir });
    if (force) query.set("force", "1");
    const response = await fetch(`/api/hardware?${query.toString()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const profiles = payload.profiles || {};
    let selectedUnavailable = false;
    Array.from(elements.encoderProfile?.options || []).forEach((option) => {
      const baseLabel = option.dataset.baseLabel || option.textContent.replace(/（当前不可用）$/, "");
      option.dataset.baseLabel = baseLabel;
      const result = profiles[option.value];
      const unavailable = result && result.available === false;
      option.disabled = Boolean(unavailable);
      option.textContent = unavailable ? `${baseLabel}（当前不可用）` : baseLabel;
      option.title = result?.detail || "";
      if (option.selected && unavailable) selectedUnavailable = true;
    });
    if (selectedUnavailable) elements.encoderProfile.value = "cpu";
    const gpuNames = (payload.gpus || []).join(" / ") || "未读取到显卡名称";
    const available = Object.entries(profiles)
      .filter(([name, result]) => name !== "cpu" && result.available)
      .map(([name]) => ({ nvgpu: "NVENC", nnvgpu: "CUDA overlay", qsv: "Intel QSV", amf_h264: "AMD AMF" })[name] || name);
    const amf = profiles.amf_h264;
    const amfText = amf?.available ? "AMD AMF 可用" : "AMD AMF 当前不可用（需要 AMD 显卡与驱动）";
    elements.hardwareStatus.textContent = `${gpuNames}\n可用加速：${available.join("、") || "无"}\n${amfText}`;
    if (selectedUnavailable) render();
  } catch (error) {
    elements.hardwareStatus.textContent = `显卡检测失败：${String(error.message || error)}`;
  }
}

function applyTheme(value, persist = true) {
  const theme = ["night", "day", "green"].includes(value) ? value : "night";
  document.documentElement.dataset.theme = theme;
  if (elements.themeSelect) elements.themeSelect.value = theme;
  if (persist) localStorage.setItem("overlayDesignerTheme", theme);
}

function bindControls() {
  elements.stage.addEventListener("click", () => {
    if (state.previewFrameUrl) {
      state.previewFrameUrl = null;
      renderStage();
      return;
    }
    state.selectedId = null;
    render();
  });

  [elements.videoPath, elements.outputFolder, elements.outputName, elements.outputPath, elements.dataPath, elements.useExternalData, elements.ffmpegDir, elements.overlayFont, elements.layoutPreset, elements.mapStyle, elements.mapApiKey, elements.encoderProfile, elements.useMapProxy, elements.mapProxy, elements.useGoproGps, elements.useGoproImu, elements.compareGps, elements.speedUnit, elements.altUnit, elements.mergeMode].forEach((control) => {
    if (!control) return;
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });

  [elements.canvasWidth, elements.canvasHeight].forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", handleCanvasSizeChange);
  });

  elements.layoutPreset.addEventListener("change", loadLayoutPreset);

  elements.themeSelect?.addEventListener("change", () => {
    applyTheme(elements.themeSelect.value);
  });

  elements.useExternalData.addEventListener("change", () => {
    if (!elements.useExternalData.checked) {
      applyMergeMode("GOPRO_ONLY");
      return;
    }
    if (elements.mergeMode.value === "GOPRO_ONLY") {
      applyMergeMode("EXTEND");
      return;
    }
    render();
  });

  elements.useGoproImu?.addEventListener("change", () => {
    if (elements.useGoproImu.checked) {
      if (!state.widgets.some((item) => IMU_WIDGET_TYPES.includes(item.type) && item.visible)) ensureWidget("imu_accel");
    } else {
      state.widgets.forEach((item) => {
        if (IMU_WIDGET_TYPES.includes(item.type)) item.visible = false;
      });
      const selected = state.widgets.find((item) => item.id === state.selectedId);
      if (selected && IMU_WIDGET_TYPES.includes(selected.type)) state.selectedId = null;
    }
    render();
  });

  document.querySelectorAll("[data-imu-widget]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => setWidgetTypeVisible(checkbox.dataset.imuWidget, checkbox.checked));
  });


  elements.compareGps.addEventListener("change", () => {
    if (elements.compareGps.checked) {
      applyMergeMode("COMPARE");
      return;
    }
    if (elements.mergeMode.value === "COMPARE" || elements.mergeMode.value === "OPTIMIZED") {
      applyMergeMode("EXTEND");
      return;
    }
    render();
  });

  elements.gpsSync.addEventListener("change", () => {
    if (elements.gpsSync.value === "position") {
      elements.useExternalData.checked = true;
    }
    render();
  });

  elements.useGoproGps.addEventListener("change", () => {
    if (!elements.useExternalData.checked) return;
    applyMergeMode(elements.useGoproGps.checked ? "EXTEND" : "OVERWRITE");
  });

  elements.mergeMode.addEventListener("change", () => {
    applyMergeMode(elements.mergeMode.value);
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      document.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("active", item === button));
      render();
    });
  });

  elements.widgetName.addEventListener("input", () => updateSelected({ name: safeName(elements.widgetName.value) }));
  elements.widgetX.addEventListener("input", () => updateSelected({ x: Number(elements.widgetX.value) || 0 }));
  elements.widgetY.addEventListener("input", () => updateSelected({ y: Number(elements.widgetY.value) || 0 }));
  elements.widgetScale.addEventListener("input", () => updateSelected({ scale: Number(elements.widgetScale.value) || 100 }));
  elements.widgetVisible.addEventListener("change", () => updateSelected({ visible: elements.widgetVisible.checked }));

  document.getElementById("removeWidget").addEventListener("click", () => {
    const official = selectedOfficial();
    if (official) {
      official.visible = false;
      state.officialXml = officialXmlWithPositions();
    } else {
      state.widgets = state.widgets.filter((item) => item.id !== state.selectedId);
    }
    state.selectedId = null;
    render();
  });

  document.getElementById("duplicateWidget").addEventListener("click", () => {
    const selected = state.widgets.find((item) => item.id === state.selectedId);
    if (!selected) return;
    const copy = { ...selected, id: nextId(), name: uniqueName(selected.type), x: selected.x + 40, y: selected.y + 40 };
    state.widgets.push(copy);
    state.selectedId = copy.id;
    render();
  });

  document.getElementById("clearWidgets").addEventListener("click", () => {
    state.widgets = [];
    state.selectedId = null;
    render();
  });

  document.getElementById("fitPreset").addEventListener("click", loadGarminPreset);
  document.getElementById("compareGpsPreset").addEventListener("click", loadCompareGpsPreset);
  document.getElementById("saveLayoutLocal").addEventListener("click", saveLayoutLocal);
  document.getElementById("previewFrame").addEventListener("click", generatePreviewFrame);
  document.getElementById("startRender").addEventListener("click", startRender);
  document.getElementById("cancelRender").addEventListener("click", cancelRender);
  document.getElementById("downloadXml").addEventListener("click", downloadXml);
  document.getElementById("copyCommand").addEventListener("click", copyCommand);
  document.getElementById("savePreset").addEventListener("click", savePreset);
  document.getElementById("loadPreset").addEventListener("click", () => elements.presetFile.click());
  document.querySelectorAll(".toolbar-menu-panel button").forEach((button) => {
    button.addEventListener("click", () => button.closest(".toolbar-menu")?.removeAttribute("open"));
  });
  elements.presetFile.addEventListener("change", loadPresetFile);
  document.getElementById("browseOutputFolder").addEventListener("click", browseOutputFolder);
  document.getElementById("browseVideoPath").addEventListener("click", () => browseInputFile("video"));
  document.getElementById("browseDataPath").addEventListener("click", () => browseInputFile("data"));
  document.getElementById("toggleMapApiKey")?.addEventListener("click", toggleMapApiKeyVisibility);
  document.getElementById("detectHardware")?.addEventListener("click", () => detectHardwareEncoders(true));
  document.getElementById("saveAppSettings")?.addEventListener("click", saveAppSettings);
}

async function loadLayoutPreset() {
  const preset = elements.layoutPreset.value;
  if (preset === "garmin") {
    state.officialXml = null;
    state.officialPreview = [];
    state.previewFrameUrl = null;
    loadGarminPreset();
    return;
  }

  const response = await fetch("./official-layouts/" + preset);
  if (!response.ok) throw new Error("Could not load layout preset " + preset);
  state.officialXml = applyOfficialDataSourceDefaults(await response.text());
  state.widgets = [];
  state.previewFrameUrl = null;
  state.officialPreview = parseOfficialLayout(state.officialXml);
  applyOfficialCanvasSize(preset);
  state.canvasSize = currentSize();
  state.selectedId = null;
  render();
}

function applyOfficialDataSourceDefaults(xml) {
  elements.useExternalData.checked = true;
  elements.useGoproGps.checked = true;
  elements.compareGps.checked = true;
  elements.mergeMode.value = "OPTIMIZED";
  elements.gpsSync.value = "time";

  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) return xml;
  doc.querySelectorAll('[metric="alt"]').forEach((node) => node.setAttribute("metric", "garmin_alt"));
  doc.querySelectorAll('component[type="moving_map"]').forEach((node) => node.setAttribute("zoom", String(mapZoomValue())));
  return new XMLSerializer().serializeToString(doc);
}

function updateSelected(patch) {
  const selected = state.widgets.find((item) => item.id === state.selectedId);
  const official = selectedOfficial();
  if (!selected && !official) return;
  if (selected) {
    Object.assign(selected, patch);
  } else {
    if (Object.prototype.hasOwnProperty.call(patch, "name")) official.label = safeName(patch.name);
    if (Object.prototype.hasOwnProperty.call(patch, "x")) official.x = patch.x;
    if (Object.prototype.hasOwnProperty.call(patch, "y")) official.y = patch.y;
    if (Object.prototype.hasOwnProperty.call(patch, "visible")) official.visible = patch.visible;
    state.officialXml = officialXmlWithPositions();
  }
  render();
}
function ensureCompareGpsWidgets() {
  ["gopro_speed", "garmin_speed", "gopro_alt", "garmin_alt", "gopro_distance", "garmin_distance"].forEach((type) => ensureWidget(type));
}

function loadCompareGpsPreset() {
  state.officialXml = null;
  state.officialPreview = [];
  elements.useExternalData.checked = true;
  elements.useGoproGps.checked = true;
  elements.compareGps.checked = true;
  elements.mergeMode.value = "COMPARE";
  state.widgets = [
    preset("gopro_speed", "gopro_speed", 42, 720, 115),
    preset("garmin_speed", "garmin_speed", 300, 720, 115),
    preset("gopro_alt", "gopro_altitude", 42, 860, 105),
    preset("garmin_alt", "garmin_altitude", 300, 860, 105),
    preset("gopro_distance", "gopro_distance", 42, 980, 105),
    preset("garmin_distance", "garmin_distance", 300, 980, 105),
    preset("hr", "heart_rate", 1640, 820, 105),
    preset("cadence", "cadence", 1640, 900, 105),
    preset("power", "power", 1640, 980, 105),
    preset("moving_map", "moving_map", 1624, 92, 100),
    preset("datetime", "date_time", 42, 36, 100)
  ];
  state.selectedId = state.widgets[0].id;
  render();
}

function loadGarminPreset() {
  state.widgets = [
    preset("speed", "speed_big", 42, 790, 150),
    preset("hr", "heart_rate", 1640, 820, 105),
    preset("cadence", "cadence", 1640, 900, 105),
    preset("power", "power", 1640, 980, 105),
    preset("alt", "altitude", 42, 972, 105),
    preset("gradient", "gradient", 260, 972, 105),
    preset("chart", "alt_chart", 510, 966, 100),
    preset("moving_map", "moving_map", 1624, 92, 100),
    preset("journey_map", "journey_map", 1624, 380, 100),
    preset("datetime", "date_time", 42, 36, 100)
  ];
  state.selectedId = state.widgets[0].id;
  render();
}

function preset(type, name, x, y, scale) {
  return { id: nextId(), type, name, x, y, scale, visible: true };
}

function handleCanvasSizeChange() {
  const previous = state.canvasSize || { width: BASE_WIDTH, height: BASE_HEIGHT };
  const next = currentSize();
  const ratioX = next.width / previous.width;
  const ratioY = next.height / previous.height;
  if (Number.isFinite(ratioX) && Number.isFinite(ratioY) && ratioX > 0 && ratioY > 0) {
    state.widgets.forEach((item) => {
      item.x = Math.round(item.x * ratioX);
      item.y = Math.round(item.y * ratioY);
    });
    state.officialPreview.forEach((item) => {
      item.x = Math.round(item.x * ratioX);
      item.y = Math.round(item.y * ratioY);
      item.width = Math.round(item.width * ratioX);
      item.height = Math.round(item.height * ratioY);
    });
  }
  state.canvasSize = next;
  render();
}

function downloadXml() {
  downloadText(state.mode === "clean" ? "empty-layout.xml" : "my-layout.xml", elements.xmlOutput.value, "application/xml");
}

async function copyCommand() {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(elements.commandOutput.value);
    return;
  }
  elements.commandOutput.focus();
  elements.commandOutput.select();
  document.execCommand("copy");
}

function renderPayload() {
  const size = currentSize();
  return {
    xml: buildXml(),
    mode: state.mode,
    videoPath: videoPathValue(),
    outputFolder: outputFolderValue(),
    outputName: outputNameValue(),
    outputPath: outputPathValue(),
    dataPath: elements.dataPath.value.trim(),
    useExternalData: elements.useExternalData.checked,
    useGoproGps: elements.useGoproGps.checked,
    useGoproImu: elements.useGoproImu?.checked ?? false,
    compareGps: elements.compareGps.checked,
    gpsSync: elements.gpsSync?.value || "time",
    ffmpegDir: elements.ffmpegDir.value.trim(),
    fontPath: elements.overlayFont?.value.trim() || "",
    mapStyle: elements.mapStyle.value || "cyclosm",
    mapApiKey: elements.mapApiKey?.value.trim() || "",
    encoderProfile: elements.encoderProfile?.value || "cpu",
    videoBitrate: elements.videoBitrate?.value || "80M",
    useMapProxy: elements.useMapProxy?.checked ?? false,
    mapProxy: normalizeMapProxy(elements.mapProxy?.value || "http://127.0.0.1:10808"),
    speedUnit: elements.speedUnit.value,
    altUnit: elements.altUnit.value,
    canvasWidth: size.width,
    canvasHeight: size.height
  };
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    const error = new Error(data.error || `Request failed: ${response.status}`);
    error.log = data.log || "";
    throw error;
  }
  return data;
}

function setRenderProgress(percent, label, detail) {
  const value = clamp(Math.round(percent || 0), 0, 100);
  elements.progressFill.style.width = `${value}%`;
  elements.progressPercent.textContent = `${value}%`;
  elements.progressLabel.textContent = label || "\u7b49\u5f85\u5bfc\u51fa";
  elements.progressDetail.textContent = detail || "";
}

function parseRenderProgress(log, status) {
  const text = log || "";
  if (status?.returncode === 0) {
    return { percent: 100, label: "\u5bfc\u51fa\u5b8c\u6210", detail: status.output ? `\u8f93\u51fa\u6587\u4ef6\uff1a${status.output}` : "" };
  }
  if (status?.returncode != null) {
    return { percent: 100, label: "\u5bfc\u51fa\u5931\u8d25", detail: `\u9000\u51fa\u7801\uff1a${status.returncode}\u3002\u8bf7\u67e5\u770b\u4e0b\u65b9\u65e5\u5fd7\u3002` };
  }
  if (text.includes("Waiting for ffmpeg to complete") || text.includes("waiting for ffmpeg to catch up")) {
    return { percent: 98, label: "\u7b49\u5f85 FFmpeg \u5c01\u88c5\u89c6\u9891", detail: "\u753b\u9762\u5df2\u7ecf\u7ed8\u5236\u5b8c\u6210\uff0c\u6b63\u5728\u5199\u5165\u6700\u7ec8\u89c6\u9891\u6587\u4ef6\u3002" };
  }
  if (text.includes("Cannot download a tile")) {
    return { percent: status?.running ? 15 : 100, label: "\u5730\u56fe\u5e95\u56fe\u4e0b\u8f7d\u5931\u8d25", detail: "\u8f68\u8ff9\u7ebf\u53ef\u4ee5\u751f\u6210\uff0c\u4f46\u5e95\u56fe\u74e6\u7247\u6ca1\u6709\u4e0b\u8f7d\u5b8c\u6574\u3002\u5efa\u8bae\u4fdd\u7559 CyclOSM\u3001\u7a0d\u540e\u91cd\u8bd5\uff0c\u6216\u5148\u53d6\u6d88\u5730\u56fe\u6d6e\u7a97\u3002" };
  }
  const renderLines = text.split(/\r?\n|\r/).filter((line) => line.includes("Render:") && line.includes("["));
  if (renderLines.length > 0) {
    const last = renderLines[renderLines.length - 1];
    const percentMatch = last.match(/\[\s*(\d+)%\]/);
    const bracketMatches = Array.from(last.matchAll(/\[([^\]]+)\]/g)).map((match) => match[1].trim());
    const percent = percentMatch ? Number(percentMatch[1]) : 0;
    const rate = bracketMatches.length >= 2 ? bracketMatches[1] : "";
    const etaIndex = last.indexOf("ETA:");
    const timeIndex = last.indexOf("Time:");
    const eta = etaIndex >= 0 ? last.slice(etaIndex + 4).trim() : timeIndex >= 0 ? last.slice(timeIndex + 5).trim() : "";
    return { percent, label: percent >= 100 ? "\u5e27\u7ed8\u5236\u5b8c\u6210" : "\u6b63\u5728\u7ed8\u5236\u6d6e\u7a97\u5e27", detail: [rate ? `\u901f\u5ea6 ${rate}` : "", eta ? `\u5269\u4f59/\u8017\u65f6 ${eta}` : ""].filter(Boolean).join(" ? ") };
  }
  const gpsAlignment = text.match(/GPS position sync: Garmin-GoPro offset ([+-]?\d+(?:\.\d+)?)s, median error (\d+(?:\.\d+)?)m/);
  if (gpsAlignment) {
    return {
      percent: 4,
      label: "GPS \u4f4d\u7f6e\u62df\u5408\u5b8c\u6210",
      detail: `\u5df2\u81ea\u52a8\u6821\u6b63 ${gpsAlignment[1]} \u79d2\uff0c\u8f68\u8ff9\u4e2d\u4f4d\u8bef\u5dee ${gpsAlignment[2]} \u7c73\u3002`
    };
  }
  if (text.includes("Processing")) {
    return { percent: 5, label: "\u6b63\u5728\u51c6\u5907\u6e32\u67d3", detail: "\u5df2\u5f00\u59cb\u8bfb\u53d6\u89c6\u9891\u548c GPS \u6570\u636e\u3002" };
  }
  if (status?.running) {
    return { percent: 2, label: "\u5bfc\u51fa\u5df2\u542f\u52a8", detail: "\u7b49\u5f85\u7b2c\u4e00\u6279\u8fdb\u5ea6\u65e5\u5fd7\u3002" };
  }
  return { percent: 0, label: "\u7b49\u5f85\u5bfc\u51fa", detail: "\u9009\u62e9\u89c6\u9891\u540e\u70b9\u51fb\u201c\u5f00\u59cb\u5bfc\u51fa\u201d\u3002" };
}

function showServerHint(error) {
  elements.renderStatus.textContent = [
    "\u8bf7\u6c42\u5931\u8d25\u3002\u53ef\u80fd\u662f\u670d\u52a1\u672a\u542f\u52a8\u3001\u8def\u5f84\u586b\u5199\u9519\u8bef\uff0c\u6216\u5f53\u524d\u5df2\u6709\u5bfc\u51fa\u4efb\u52a1\u3002",
    "",
    "\u8bf7\u56de\u5230\u7a0b\u5e8f\u76ee\u5f55\u53cc\u51fb start-panel.bat\uff0c\u6216\u5728 PowerShell \u8fd0\u884c\uff1a",
    "powershell -ExecutionPolicy Bypass -File .\\start-panel.ps1",
    "",
    "\u7136\u540e\u7528\u811a\u672c\u8f93\u51fa\u7684 http://127.0.0.1:\u7aef\u53e3/ \u6253\u5f00\u7f51\u9875\u3002",
    "",
    String(error.message || error)
  ].join("\n");
}

async function saveLayoutLocal() {
  try {
    const result = await postJson("/api/save-layout", renderPayload());
    setRenderProgress(0, "\u5e03\u5c40\u5df2\u4fdd\u5b58", result.path);
    elements.renderStatus.textContent = `\u5df2\u4fdd\u5b58\u5e03\u5c40\uff1a${result.path}`;
  } catch (error) {
    showServerHint(error);
  }
}

async function browseOutputFolder() {
  try {
    const result = await postJson("/api/select-output-folder", {
      outputFolder: outputFolderValue(),
      videoPath: videoPathValue()
    });
    if (result.folder && elements.outputFolder) {
      elements.outputFolder.value = result.folder;
      normalizeOutputField();
      render();
    }
  } catch (error) {
    showServerHint(error);
  }
}

async function browseInputFile(kind) {
  try {
    const control = kind === "video" ? elements.videoPath : elements.dataPath;
    const result = await postJson("/api/select-input-file", {
      kind,
      currentPath: control.value.trim()
    });
    if (!result.path) return;
    control.value = result.path;
    if (kind === "video") {
      normalizeVideoField();
      normalizeOutputField();
    } else {
      elements.useExternalData.checked = true;
    }
    render();
  } catch (error) {
    showServerHint(error);
  }
}

async function generatePreviewFrame() {
  if (state.previewFrameUrl) {
    state.previewFrameUrl = null;
    renderStage();
    return;
  }
  try {
    elements.renderStatus.textContent = "\u6b63\u5728\u751f\u6210\u771f\u5b9e\u9884\u89c8\u5e27\uff0c\u5730\u56fe\u6a21\u677f\u53ef\u80fd\u9700\u8981\u7b49\u74e6\u7247\u4e0b\u8f7d...";
    const result = await postJson("/api/preview-frame", renderPayload());
    state.previewFrameUrl = result.url;
    elements.renderStatus.textContent = `\u771f\u5b9e\u9884\u89c8\u5e27\u5df2\u751f\u6210\uff1a${result.path}`;
    renderStage();
  } catch (error) {
    showServerHint(error);
    if (error.log) {
      elements.renderStatus.textContent += `\n\n${error.log}`;
    }
  }
}

let renderPollTimer = null;
let renderPollFailures = 0;
let lastRenderStatusText = "";
let logHistorySelect = null;
let viewingArchivedLog = false;

async function refreshLogHistory(preferred = null) {
  if (!logHistorySelect) return;
  const previous = preferred || logHistorySelect.value || "current";
  try {
    const response = await fetch("/api/logs", { cache: "no-store" });
    if (!response.ok) throw new Error(`Log list failed: ${response.status}`);
    const payload = await response.json();
    logHistorySelect.innerHTML = "";
    (payload.logs || []).forEach((record) => {
      const option = document.createElement("option");
      option.value = record.name;
      option.textContent = record.label;
      logHistorySelect.appendChild(option);
    });
    if (!logHistorySelect.options.length) {
      const option = document.createElement("option");
      option.value = "current";
      option.textContent = "\u5f53\u524d / \u6700\u8fd1\u4e00\u6b21";
      logHistorySelect.appendChild(option);
    }
    logHistorySelect.value = Array.from(logHistorySelect.options).some((option) => option.value === previous) ? previous : "current";
  } catch (_error) {
    // Export status remains usable if history listing is temporarily unavailable.
  }
}

async function showSelectedLog() {
  if (!logHistorySelect || logHistorySelect.value === "current") {
    viewingArchivedLog = false;
    await pollRenderStatus();
    return;
  }
  viewingArchivedLog = true;
  try {
    const response = await fetch(`/api/log?name=${encodeURIComponent(logHistorySelect.value)}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Log read failed: ${response.status}`);
    const payload = await response.json();
    elements.renderStatus.textContent = payload.text || "\u65e5\u5fd7\u4e3a\u7a7a\u3002";
  } catch (error) {
    elements.renderStatus.textContent = `\u8bfb\u53d6\u5386\u53f2\u65e5\u5fd7\u5931\u8d25\uff1a${String(error.message || error)}`;
  }
}

async function initializeLogHistory() {
  const body = document.querySelector(".diagnostics-body");
  if (!body || document.getElementById("logHistory")) return;
  const toolbar = document.createElement("div");
  toolbar.className = "log-history-toolbar";
  const label = document.createElement("span");
  label.textContent = "\u6700\u8fd1\u65e5\u5fd7";
  logHistorySelect = document.createElement("select");
  logHistorySelect.id = "logHistory";
  logHistorySelect.setAttribute("aria-label", "\u6700\u8fd1\u5bfc\u51fa\u65e5\u5fd7");
  const refresh = document.createElement("button");
  refresh.type = "button";
  refresh.textContent = "\u5237\u65b0";
  refresh.title = "\u5237\u65b0\u65e5\u5fd7\u5217\u8868";
  toolbar.append(label, logHistorySelect, refresh);
  body.insertBefore(toolbar, elements.renderStatus);
  logHistorySelect.addEventListener("change", showSelectedLog);
  refresh.addEventListener("click", async () => {
    await refreshLogHistory();
    await showSelectedLog();
  });
  await refreshLogHistory("current");
}

function setRenderRunning(running) {
  document.getElementById("startRender").classList.toggle("hidden", running);
  document.getElementById("cancelRender").classList.toggle("hidden", !running);
}

async function cancelRender() {
  try {
    const result = await postJson("/api/cancel", {});
    setRenderRunning(false);
    setRenderProgress(0, "\u5bfc\u51fa\u5df2\u53d6\u6d88", result.message || "\u5f53\u524d\u5bfc\u51fa\u8fdb\u7a0b\u5df2\u505c\u6b62\u3002");
    await pollRenderStatus();
  } catch (error) {
    showServerHint(error);
  }
}

async function startRender() {
  try {
    normalizeVideoField();
    normalizeOutputField();
    const result = await postJson("/api/render", renderPayload());
    setRenderRunning(true);
    setRenderProgress(1, "\u5bfc\u51fa\u5df2\u542f\u52a8", "\u6b63\u5728\u542f\u52a8 gopro-dashboard-overlay\u3002");
    elements.renderStatus.textContent = `\u5df2\u5f00\u59cb\u5bfc\u51fa\uff0cPID ${result.pid}\n\u8f93\u51fa\u6587\u4ef6\uff1a${result.output}\n\u65e5\u5fd7\uff1a${result.log}`;
    viewingArchivedLog = false;
    await refreshLogHistory("current");
    renderPollFailures = 0;
    pollRenderStatus();
    if (renderPollTimer) window.clearInterval(renderPollTimer);
    renderPollTimer = window.setInterval(pollRenderStatus, 2500);
  } catch (error) {
    showServerHint(error);
  }
}

async function pollRenderStatus() {
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    if (!response.ok) throw new Error(`Status failed: ${response.status}`);
    const status = await response.json();
    setRenderRunning(Boolean(status.running));
    renderPollFailures = 0;
    const progress = parseRenderProgress(status.log || "", status);
    setRenderProgress(progress.percent, progress.label, progress.detail);
    const lines = [
      status.running ? "\u6b63\u5728\u5bfc\u51fa..." : status.returncode === 0 ? "\u5bfc\u51fa\u5b8c\u6210\u3002" : status.returncode == null ? "\u5c1a\u672a\u5f00\u59cb\u5bfc\u51fa\u3002" : `\u5bfc\u51fa\u7ed3\u675f\uff0c\u9000\u51fa\u7801\uff1a${status.returncode}`,
      status.output ? `\u8f93\u51fa\u6587\u4ef6\uff1a${status.output}` : "",
      status.started ? `\u5f00\u59cb\u65f6\u95f4\uff1a${status.started}` : "",
      progress.detail ? `\u8fdb\u5ea6\uff1a${progress.percent}% \u00b7 ${progress.detail}` : `\u8fdb\u5ea6\uff1a${progress.percent}%`,
      "",
      status.log || ""
    ];
    lastRenderStatusText = lines.filter(Boolean).join("\n");
    if (!viewingArchivedLog) elements.renderStatus.textContent = lastRenderStatusText;
    if (!status.running && renderPollTimer) {
      window.clearInterval(renderPollTimer);
      renderPollTimer = null;
    }
  } catch (error) {
    renderPollFailures += 1;
    if (renderPollTimer) {
      const previous = lastRenderStatusText || elements.renderStatus.textContent || "";
      const retryNote = [
        "\u8fdb\u5ea6\u8fde\u63a5\u6682\u65f6\u4e2d\u65ad\uff0c\u6b63\u5728\u81ea\u52a8\u91cd\u8bd5\u3002",
        `\u8fde\u7eed\u5931\u8d25\u6b21\u6570\uff1a${renderPollFailures}`,
        `\u6700\u540e\u9519\u8bef\uff1a${String(error.message || error)}`,
        "",
        previous
      ];
      if (!viewingArchivedLog) elements.renderStatus.textContent = retryNote.filter(Boolean).join("\n");
      setRenderProgress(2, "\u8fdb\u5ea6\u8fde\u63a5\u91cd\u8bd5\u4e2d", "\u540e\u53f0\u5bfc\u51fa\u4efb\u52a1\u53ef\u80fd\u4ecd\u5728\u8fd0\u884c\uff0c\u7f51\u9875\u4f1a\u7ee7\u7eed\u8f6e\u8be2\u3002");
      return;
    }
    showServerHint(error);
  }
}

async function initializeRenderStatus() {
  await pollRenderStatus();
  const cancelButton = document.getElementById("cancelRender");
  if (!cancelButton.classList.contains("hidden") && !renderPollTimer) {
    renderPollTimer = window.setInterval(pollRenderStatus, 2500);
  }
}

function savePreset() {
  const payload = {
    version: 1,
    mode: state.mode,
    controls: {
      videoPath: elements.videoPath.value,
      outputFolder: elements.outputFolder?.value || "",
      outputName: elements.outputName?.value || "",
      outputPath: outputPathValue(),
      dataPath: elements.dataPath.value,
      useExternalData: elements.useExternalData.checked,
      ffmpegDir: elements.ffmpegDir.value,
      overlayFont: elements.overlayFont?.value || "",
      mapStyle: elements.mapStyle.value,
      mapZoom: elements.mapZoom?.value || "16",
      encoderProfile: elements.encoderProfile?.value || "cpu",
      videoBitrate: elements.videoBitrate?.value || "80M",
      useMapProxy: elements.useMapProxy?.checked ?? false,
      mapProxy: elements.mapProxy?.value || "http://127.0.0.1:10808",
      useGoproGps: elements.useGoproGps.checked,
      useGoproImu: elements.useGoproImu?.checked ?? false,
      compareGps: elements.compareGps.checked,
      gpsSync: elements.gpsSync?.value || "time",
      canvasWidth: elements.canvasWidth.value,
      canvasHeight: elements.canvasHeight.value,
      speedUnit: elements.speedUnit.value,
      altUnit: elements.altUnit.value,
      mergeMode: elements.mergeMode.value
    },
    widgets: state.widgets
  };
  downloadText("overlay-preset.json", JSON.stringify(payload, null, 2), "application/json");
}

function loadPresetFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const payload = JSON.parse(reader.result);
    const controls = payload.controls || {};
    Object.entries(controls).forEach(([key, value]) => {
      if (!elements[key]) return;
      if (elements[key].type === "checkbox") {
        elements[key].checked = Boolean(value);
      } else {
        elements[key].value = value;
      }
    });
    if (controls.outputPath && !controls.outputFolder && !controls.outputName) {
      const split = splitOutputPath(controls.outputPath);
      if (elements.outputFolder) elements.outputFolder.value = split.folder;
      if (elements.outputName) elements.outputName.value = split.name;
    }
    normalizeOutputField();
    state.mode = payload.mode || "burn";
    state.officialXml = null;
    state.officialPreview = [];
    state.widgets = Array.isArray(payload.widgets) ? payload.widgets.map((item) => ({ ...item, id: nextId() })) : [];
    state.selectedId = state.widgets[0]?.id || null;
    state.canvasSize = currentSize();
    document.querySelectorAll("[data-mode]").forEach((button) => button.classList.toggle("active", button.dataset.mode === state.mode));
    render();
  };
  reader.readAsText(file);
  event.target.value = "";
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function xmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;"
  })[char]);
}

function safeName(value) {
  return (value || "widget").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

configureMergeModes();
configureEncoderOptions();
configureVideoQualityControl();
configureMapZoomControl();
renderPalette();
applyTheme(localStorage.getItem("overlayDesignerTheme") || "night", false);
bindControls();

async function initializeApplication() {
  await loadAppSettings();
  state.canvasSize = currentSize();
  loadGarminPreset();
  initializeLogHistory().then(initializeRenderStatus, initializeRenderStatus);
  detectHardwareEncoders(false);
}

initializeApplication();
