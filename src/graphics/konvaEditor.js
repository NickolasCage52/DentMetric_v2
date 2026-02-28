import Konva from 'konva';
import { getInterpolatedPriceByAreaMm2 as interpolateByAreaMm2, getClosestSizeCodeByAreaMm2 } from '../utils/priceAdapter';
import { normalizeNumber, clamp } from '../utils/validation';

const RIB_MULTIPLIER = 1.3;
const CELL_MM = 30;
const HEAT_RATIO_THRESHOLD = 0.08;
/** A) Bounds для вмятин: зазор вокруг детали (px в stage). */
const BOUNDS_MARGIN_PX = 12;
/** Отступ сетки от края видимой части детали (1–2px). */
const GRID_PADDING_PX = 2;
/** Отключить визуальную сетку в детализации. */
const GRID_ENABLED = false;
/** B) Hit area: доля от размера фигуры, min/max px (удобный захват пальцем, но не мешает другим). */
const HIT_SIZE_MIN = 8;
const HIT_SIZE_MAX = 16;
const HIT_SIZE_RATIO = 0.42;
/** C) Stroke: тоньше для маленьких (minSizePx < 40), clamp. */
const STROKE_THIN = 0.8;
const STROKE_NORMAL = 1.4;
const STROKE_MIN = 0.6;
const STROKE_MAX = 2;
/** D) Удаление белого фона: порог RGB (255=только чисто белый). Уменьшить до 240 если «съедает» края. */
const REMOVE_WHITE_BACKGROUND = true;
const WHITE_THRESHOLD = 245;
/** E) Минимальный размер при ресайзе (px) — защита от инверсии и слишком мелких фигур. */
const MIN_TRANSFORM_SIZE_PX = 10;
/** B) Handle для перемещения вмятины: линия + крестик; смещён гораздо ниже формы. */
const HANDLE_OFFSET_MIN = 36;
const HANDLE_OFFSET_MAX = 70;
const HANDLE_OFFSET_RATIO = 0.4;
const HANDLE_HIT_RADIUS = 16;
const HANDLE_COLOR = '#88E523';
const HANDLE_FILL = 'rgba(136,229,35,0.22)';
const HANDLE_STROKE = 'rgba(136,229,35,0.9)';
const HANDLE_RING_STROKE = 'rgba(136,229,35,0.4)';
const HANDLE_VISUAL_RADIUS = 8;
/** Freeform edit handles */
const FREEFORM_POINT_RADIUS = 4;
const FREEFORM_POINT_HIT_RADIUS = 12;
const FREEFORM_ADD_MAX_DIST = 14;
const FREEFORM_LONG_PRESS_MS = 450;

let stage = null;
let containerRef = null;
let layerParts = null;
let layerGrid = null;
let layerDents = null;
let tr = null;
let selectedPart = null;
let prices = {};
let onDentChangeCallback = null;
/** Вызывается при смене выбора или изменении размеров выбранной вмятины (для UI «Размеры мм»). */
let onSelectedDentChangeCallback = null;
let dentsMap = new Map();
let partBounds = null;
let stageBounds = null;
let baseUrl = '';

/** Режим мм: деталь с realSizeMm и изображением */
let pxPerMm = null;
let imageRect = null; // { x, y, width, height } — bbox в координатах contentGroup (displayRect)
let imageNode = null; // Konva.Image/Rect детали для getClientRect (режим мм)
let useMmMode = false;
/** Display unit for dimension labels: 'mm' | 'cm' */
let displayUnit = 'mm';
/** gridRect в координатах contentGroup — область сетки (bbox детали + padding). Для clip и bounds вмятин. */
let gridRectRef = null;

/** Automatic fit-to-width transform: только baseScale и basePos (автоматическое масштабирование) */
let baseScale = 1;
let basePos = { x: 0, y: 0 };
let contentGroup = null;
let contentWidth = 0;
let contentHeight = 0;
/** Scheduler: один fit за RAF, без дерганий */
let fitPending = false;
/** Размеры stage при последнем fit (чтобы не двигать вид при ложном resize, напр. после закрытия модалки) */
let lastFitW = 0;
let lastFitH = 0;
/** Допуск в px: при изменении размера не больше этого считаем "без изменений", вид статичен */
const FIT_SIZE_TOLERANCE_PX = 4;
/** Сложные зоны в px в координатах stage для расчёта пересечения */
let heatZonesPx = [];
/** Тёмный фон stage в режиме мм (под contentGroup) */
let bgRect = null;
/** Фото-фон для режима «Произвольно» (поверх bgRect, под contentGroup) */
let layerPhoto = null;
let photoImageNode = null;
/** B) Handle для перемещения выбранной вмятины (крестик снизу). Только в mm-режиме. */
let handleGroup = null;
let activeDent = null;
let lastPlusPos = { x: 0, y: 0 };
/** Freeform edit mode */
let freeformEditMode = false;
let freeformEditGroup = null;
let freeformEditTarget = null;
/** Режим свободного растяжения (не keepRatio) для выбранной вмятины. */
let transformerKeepRatio = true;
/** ResizeObserver и window resize — для подстройки Stage под контейнер. */
let resizeObserverRef = null;
let resizeObservedEl = null;
let windowResizeHandler = null;
/** Текущий шаг визарда: 1=Размещение (форма и handle draggable), 2+=редактирование. */
let wizardStep = 2;
/** Скрыть сетку на мобильных (узкий экран). */
let hideGridOnMobile = false;

/** Freeform drawing state */
let freeformDrawing = false;
let freeformSizes = null;
let freeformLine = null;
let freeformPoints = [];
let freeformListenersBound = false;

function getActiveNode() {
  if (!tr) return null;
  const nodes = tr.nodes();
  if (nodes && nodes.length > 0) return nodes[0];
  /** На этапе 1 Transformer не привязан — используем activeDent для выбора и удаления. */
  if (useMmMode && activeDent) return activeDent;
  return null;
}

/** Get the visual shape (Ellipse/Rect/Line) from a dent node (Group or raw shape). */
function getDentShape(node) {
  if (!node) return null;
  if (node.className === 'Ellipse' || node.className === 'Rect' || node.className === 'Line') return node;
  if (node.className === 'Group' && node.getChildren) {
    const children = node.getChildren();
    for (const c of children) {
      if (c.className === 'Ellipse' || c.className === 'Rect' || c.className === 'Line') return c;
    }
  }
  return null;
}

/** Create or update W×H label inside dent. Hide until sizes known. */
function updateDentDimLabel(dentNode, widthMm, heightMm) {
  if (!dentNode) return;
  if (!useMmMode) return;
  const hasMm = (Number(widthMm) || 0) > 0 && (Number(heightMm) || 0) > 0;
  if (!pxPerMm && !hasMm) return;
  const w = Number(widthMm) || 0;
  const h = Number(heightMm) || 0;
  const shape = getDentShape(dentNode);
  if (!shape) return;
  let label = dentNode._dimLabel;
  if (w <= 0 || h <= 0) {
    if (label) {
      label.visible(false);
      const layer = dentNode.getLayer();
      if (layer) layer.batchDraw();
    }
    return;
  }
  const unit = displayUnit === 'cm' ? 'см' : 'мм';
  const wD = displayUnit === 'cm' ? (w / 10).toFixed(1) : Math.round(w);
  const hD = displayUnit === 'cm' ? (h / 10).toFixed(1) : Math.round(h);
  const text = `${wD}×${hD} ${unit}`;
  const parent = dentNode.getParent ? dentNode.getParent() : dentNode.parent;
  if (!label) {
    label = new Konva.Text({
      text,
      fontSize: 14,
      fontFamily: 'sans-serif',
      fill: '#ffffff',
      shadowColor: '#000',
      shadowBlur: 3,
      shadowOffset: { x: 1, y: 1 },
      listening: false,
      name: 'dent-dim-label'
    });
    dentNode._dimLabel = label;
    if (dentNode.className === 'Group' && dentNode.add) {
      dentNode.add(label);
    } else if (parent && parent.add) {
      parent.add(label);
    }
  } else {
    label.text(text);
  }
  const rect = shape.getClientRect ? shape.getClientRect({ relativeTo: parent }) : { x: 0, y: 0, width: 1, height: 1 };
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  label.position({ x: cx, y: cy });
  label.offsetX(label.width() / 2);
  label.offsetY(label.height() / 2);
  const sizePx = Math.min(rect.width, rect.height);
  const fontSize = Math.max(11, Math.min(22, Math.round(sizePx / 4.5)));
  label.fontSize(fontSize);
  label.visible(true);
  const layer = dentNode.getLayer ? dentNode.getLayer() : (dentNode.getParent?.()?.getLayer?.());
  if (layer) layer.batchDraw();
}

function isFreeformMeta(meta) {
  return !!meta && (meta.type === 'freeform' || meta.freeformEnabled);
}

function canShowTransformerForNode(node) {
  if (!node) return false;
  if (wizardStep <= 2) return false;
  const meta = node._dentMeta;
  if (!meta) return true;
  if (meta.type === 'freeform') return true;
  if (meta.freeformEnabled) return false;
  return true;
}

/** Выбрать одну фигуру. На этапе 1: только handle "плюс", без Transformer. На этапе 2+: Transformer + handle. */
function selectNode(node) {
  if (!tr || !layerDents) return;
  tr.keepRatio(transformerKeepRatio);
  /** На этапе 1 не привязываем к Transformer (нет квадратов/ручек resize). */
  const meta = node?._dentMeta;
  const showTransformer = canShowTransformerForNode(node);
  tr.nodes(showTransformer ? [node] : []);
  if (meta?.type === 'freeform') {
    tr.rotateEnabled(true);
    if (meta?.isShapeFixed) tr.keepRatio(true);
    else tr.keepRatio(!meta?.isFreeStretchEnabled);
  } else {
    tr.rotateEnabled(true);
    tr.keepRatio(transformerKeepRatio);
  }
  if (node && node.moveToTop) node.moveToTop();
  if (tr.getParent() === layerDents) tr.moveToTop();
  if (useMmMode) {
    activeDent = node && node.getAttr?.('name') === 'dent' ? node : null;
    if (handleGroup) {
      if (activeDent) {
        handleGroup.visible(true);
        positionHandle(activeDent);
      } else {
        handleGroup.visible(false);
      }
    }
  }
  if (freeformEditMode) updateFreeformEditHandles(node);
  debugFreeformState('select');
  const layer = layerDents.getLayer ? layerDents.getLayer() : layerDents;
  if (layer) layer.batchDraw();
  if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(getSelectedDentSizeMm());
}

/** Снять выделение. B) Скрываем handle. */
function clearSelection() {
  if (!tr) return;
  tr.nodes([]);
  if (useMmMode) {
    activeDent = null;
    if (handleGroup) handleGroup.visible(false);
  }
  clearFreeformEditHandles();
  const layer = layerDents ? (layerDents.getLayer ? layerDents.getLayer() : layerDents) : null;
  if (layer) layer.batchDraw();
  if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(null);
}

/**
 * B) createHandleGroup() — один handle (линия + крестик) поверх dents. Фирменный кислотно-зелёный, лёгкое свечение.
 * plusGroup draggable; визуал в plusVisualGroup (listening:false), hitCircle (listening:true).
 */
function createHandleGroup() {
  if (handleGroup) return;
  handleGroup = new Konva.Group({ name: 'dent-handle', visible: false, listening: true });
  const stemLine = new Konva.Line({
    name: 'stem-line',
    points: [0, 0, 0, 0],
    stroke: HANDLE_COLOR,
    strokeWidth: 1,
    listening: false
  });
  const plusGroup = new Konva.Group({ name: 'handle-plus', draggable: true, listening: true });
  const plusVisualGroup = new Konva.Group({ listening: false });
  const baseCircle = new Konva.Circle({
    radius: HANDLE_VISUAL_RADIUS,
    x: 0,
    y: 0,
    fill: HANDLE_FILL,
    stroke: HANDLE_STROKE,
    strokeWidth: 1.5,
    shadowColor: HANDLE_COLOR,
    shadowBlur: 8,
    shadowOpacity: 0.5,
    listening: false
  });
  const line1 = new Konva.Line({
    points: [-5, 0, 5, 0],
    stroke: HANDLE_COLOR,
    strokeWidth: 1.8,
    lineCap: 'round',
    listening: false
  });
  const line2 = new Konva.Line({
    points: [0, -5, 0, 5],
    stroke: HANDLE_COLOR,
    strokeWidth: 1.8,
    lineCap: 'round',
    listening: false
  });
  const ring = new Konva.Circle({
    radius: HANDLE_VISUAL_RADIUS + 2,
    x: 0,
    y: 0,
    stroke: HANDLE_RING_STROKE,
    strokeWidth: 1,
    listening: false
  });
  plusVisualGroup.add(baseCircle);
  plusVisualGroup.add(line1);
  plusVisualGroup.add(line2);
  plusVisualGroup.add(ring);
  const hitCircle = new Konva.Circle({
    radius: HANDLE_HIT_RADIUS,
    x: 0,
    y: 0,
    fill: 'rgba(0,0,0,0)',
    listening: true
  });
  plusGroup.add(plusVisualGroup);
  plusGroup.add(hitCircle);
  handleGroup.add(stemLine);
  handleGroup.add(plusGroup);

  plusGroup.on('click tap dragstart', (e) => {
    e.cancelBubble = true;
  });
  plusGroup.on('mousedown touchstart', () => {
    if (contentGroup) contentGroup.draggable(false);
  });
  plusGroup.on('dragstart', (e) => {
    if (e && e.cancelBubble !== undefined) e.cancelBubble = true;
    if (contentGroup) contentGroup.draggable(false);
    lastPlusPos = plusGroup.position();
  });
  plusGroup.on('dragmove', () => {
    const dent = activeDent || getActiveNode();
    if (!dent || dent.getAttr?.('name') !== 'dent') return;
    const p = plusGroup.position();
    const dx = p.x - lastPlusPos.x;
    const dy = p.y - lastPlusPos.y;
    dent.x(dent.x() + dx);
    dent.y(dent.y() + dy);
    if (useMmMode && imageNode) applyBounds(dent);
    positionHandle(dent);
    if (tr) {
      tr.nodes([dent]);
      if (tr.forceUpdate) tr.forceUpdate();
    }
    lastPlusPos = plusGroup.position();
    const meta = dent._dentMeta;
    if (meta) updateShapeCalc(dent, meta.type, meta.id, meta.sizes);
    const layer = layerDents.getLayer ? layerDents.getLayer() : layerDents;
    if (layer) layer.batchDraw();
  });
  plusGroup.on('dragend', () => {
    // Handle drag end
  });
}

/** Масштаб handle под автоматический fit: визуал не раздувается. */
function updateHandleStyle() {
  if (!handleGroup || !contentGroup) return;
  const s = contentGroup.scaleX();
  const plus = handleGroup.getChildren?.()?.[1];
  if (plus) plus.scale({ x: 1 / s, y: 1 / s });
}

/**
 * B) positionHandle(dent) — ставит handle (линия + крестик) ниже bbox формы.
 * offset = clamp(rect.height * 0.18, 18, 34) — адаптивный отступ, палец не перекрывает вмятину.
 * Координаты относительно родителя (layerDents). При перемещении вмятины плюс следует за ней.
 */
function positionHandle(dent) {
  if (!handleGroup || !dent) return;
  const parent = dent.getParent();
  const dentRect = dent.getClientRect({ relativeTo: parent });
  const anchorX = dentRect.x + dentRect.width / 2;
  const anchorY = dentRect.y + dentRect.height;
  const offset = Math.max(HANDLE_OFFSET_MIN, Math.min(HANDLE_OFFSET_MAX, dentRect.height * HANDLE_OFFSET_RATIO));
  const plusCenterX = anchorX;
  const plusCenterY = anchorY + offset;

  const children = handleGroup.getChildren ? handleGroup.getChildren() : [];
  const stemLine = children[0];
  if (stemLine) stemLine.points([anchorX, anchorY, plusCenterX, plusCenterY]);

  const plus = children[1];
  if (plus) {
    plus.position({ x: plusCenterX, y: plusCenterY });
    lastPlusPos = { x: plusCenterX, y: plusCenterY };
    updateHandleStyle();
  }
}

function isRectInside(rect, bounds) {
  if (!rect || !bounds) return true;
  return (
    rect.x >= bounds.x &&
    rect.y >= bounds.y &&
    rect.x + rect.width <= bounds.x + bounds.width &&
    rect.y + rect.height <= bounds.y + bounds.height
  );
}

function isRectInsideAllBounds(rect) {
  if (!rect) return true;
  const partOk = partBounds ? isRectInside(rect, partBounds) : true;
  const stageOk = stageBounds ? isRectInside(rect, stageBounds) : true;
  return partOk && stageOk;
}

/**
 * D) removeWhiteBackground(img) — делает близко-белые пиксели прозрачными.
 * Порог: WHITE_THRESHOLD (245). Если «съедает» края детали — уменьшить до 240 или 235.
 */
function removeWhiteBackground(srcImage) {
  return new Promise((resolve, reject) => {
    const w = srcImage.naturalWidth || srcImage.width;
    const h = srcImage.naturalHeight || srcImage.height;
    if (!w || !h) {
      resolve(srcImage);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(srcImage);
      return;
    }
    ctx.drawImage(srcImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const t = WHITE_THRESHOLD;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > t && data[i + 1] > t && data[i + 2] > t) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const dataURL = canvas.toDataURL('image/png');
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('removeWhiteBackground: failed to load result image'));
    img.src = dataURL;
  });
}

/** Кэш bbox по ключу src — не сканировать пиксели повторно. */
const alphaBoundsCache = new Map();

/**
 * computeAlphaBounds(img, alphaThreshold): bbox видимой области (контур детали).
 * - PNG с прозрачностью: alpha > threshold.
 * - JPG без alpha: исключаем near-white фон (R,G,B > WHITE_THRESHOLD).
 * Fallback: весь размер, если ничего не найдено.
 */
function computeAlphaBounds(img, alphaThreshold = 10) {
  const cacheKey = img.src || img.currentSrc || '';
  if (cacheKey && alphaBoundsCache.has(cacheKey)) {
    return alphaBoundsCache.get(cacheKey);
  }
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const fallback = { x: 0, y: 0, width: w || 1, height: h || 1 };
  if (!w || !h) return fallback;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return fallback;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;
  const whiteT = WHITE_THRESHOLD;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  let found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      const isTransparent = a <= alphaThreshold;
      const isNearWhite = r > whiteT && g > whiteT && b > whiteT;
      const isContent = !isTransparent && !isNearWhite;
      if (isContent) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const result = found
    ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
    : fallback;
  if (cacheKey) alphaBoundsCache.set(cacheKey, result);
  return result;
}

/** Bbox непустых (непрозрачных) пикселей в координатах изображения. Порог alpha. */
function getImageOpaqueBbox(img, alphaThreshold = 10) {
  const bbox = computeAlphaBounds(img, alphaThreshold);
  return bbox.width > 0 && bbox.height > 0 ? bbox : null;
}

/**
 * Загрузить изображение по src (Vite dev: /parts/..., PROD: /DentMetric/parts/...).
 * Абсолютный URL для надёжной загрузки на GitHub Pages. Только после onload строим сетку и вмятины.
 */
function loadPartImage(src) {
  const path = (src || '').replace(/^\/+/, '');
  const base = (baseUrl || import.meta.env?.BASE_URL || '/').replace(/\/$/, '') || '';
  const fullSrc = path
    ? base
      ? `${window.location.origin}${base}/${path}`
      : `/${path}`
    : '';
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) reject(new Error('Image invalid size'));
      else resolve(img);
    };
    img.onerror = () => reject(new Error('Image load failed: ' + fullSrc));
    img.src = fullSrc;
  });
}

/**
 * Инициализация Konva: поддержка детали как изображения (realSizeMm) или legacy Path
 * Для деталей с изображением — асинхронная загрузка картинки.
 */
export async function initKonva(containerEl, partData, priceMap, onDentChange, baseUrlOption = '', onSelectedDentChange = null) {
  if (!containerEl || !partData) return;

  containerRef = containerEl;
  baseUrl = baseUrlOption || '';
  selectedPart = partData;
  prices = priceMap || {};
  onDentChangeCallback = onDentChange;
  onSelectedDentChangeCallback = onSelectedDentChange ?? null;
  useMmMode = !!(partData.realSizeMm && partData.asset && partData.asset.type === 'image');
  pxPerMm = null;
  imageRect = null;

  let w = containerEl.offsetWidth || 0;
  let h = containerEl.offsetHeight || 0;
  if (w <= 0 || h <= 0) {
    await new Promise((r) => requestAnimationFrame(r));
    w = containerEl.offsetWidth || 0;
    h = containerEl.offsetHeight || 0;
  }
  if (w <= 0 || h <= 0) {
    w = Math.max(w, 320);
    h = Math.max(h, 240);
  }
  stageBounds = { x: 0, y: 0, width: w, height: h };

  if (stage) {
    stage.destroy();
    stage = null;
  }
  /** Сброс handleGroup — иначе при смене детали (капот→дверь→крыло) handle остаётся ссылкой на уничтоженный узел */
  handleGroup = null;
  activeDent = null;

  stage = new Konva.Stage({ container: containerEl, width: w, height: h });

  if (useMmMode) {
    const mainLayer = new Konva.Layer();
    stage.add(mainLayer);
    bgRect = new Konva.Rect({
      x: 0,
      y: 0,
      width: w,
      height: h,
      fill: '#0b0f14',
      listening: false
    });
    mainLayer.add(bgRect);
    contentGroup = new Konva.Group();
    contentGroup.listening(true);
    contentGroup.draggable(false);
    mainLayer.add(contentGroup);
    layerParts = new Konva.Group();
    layerParts.listening(false);
    layerParts.setAttr('isBackground', true);
    layerGrid = new Konva.Group();
    layerGrid.listening(false);
    layerGrid.setAttr('isBackground', true);
    layerDents = new Konva.Group();
    contentGroup.add(layerParts);
    contentGroup.add(layerGrid);
    contentGroup.add(layerDents);
    await initImagePart(w, h);
    contentWidth = imageRect ? imageRect.width : 0;
    contentHeight = imageRect ? imageRect.height : 0;
    contentGroup.offset({ x: 0, y: 0 });
    if (gridRectRef) {
      contentGroup.clip({ x: gridRectRef.x, y: gridRectRef.y, width: gridRectRef.width, height: gridRectRef.height });
    }
    const fit = computeFitTransform(w, h);
    baseScale = fit.scaleFit;
    basePos = { x: fit.posFit.x, y: fit.posFit.y };
    lastFitW = w;
    lastFitH = h;
    applyTransform();
  } else {
    bgRect = null;
    contentGroup = null;
    contentWidth = 0;
    contentHeight = 0;
    heatZonesPx = [];
    layerParts = new Konva.Layer();
    stage.add(layerParts);
    initLegacyPathPart(w, h);
    layerDents = new Konva.Layer();
    stage.add(layerDents);
  }

  tr = new Konva.Transformer({
    anchorStroke: '#88E523',
    anchorFill: '#0B121E',
    anchorSize: 15,
    borderStroke: '#88E523',
    borderDash: [4, 4],
    centeredScaling: true,
    rotateEnabled: true,
    keepRatio: transformerKeepRatio,
    /** Запрет инверсии (отрицательного scale) и минимальный размер при ресайзе. */
    boundBoxFunc: (oldBox, newBox) => {
      if (newBox.width < MIN_TRANSFORM_SIZE_PX || newBox.height < MIN_TRANSFORM_SIZE_PX) return oldBox;
      if (newBox.width < 0 || newBox.height < 0) return oldBox;
      return newBox;
    }
  });
  tr.on('mousedown touchstart', () => {
    if (contentGroup) contentGroup.draggable(false);
  });
  layerDents.add(tr);

  if (useMmMode) createHandleGroup();
  if (useMmMode && handleGroup) layerDents.add(handleGroup);

  stage.on('click tap', (e) => {
    const t = e.target;
    const isStage = t === stage;
    const isBackground = t?.getAttr && t.getAttr('isBackground') === true;
    const isTransformer = t === tr || (t?.getParent && t.getParent() === tr) || (tr && typeof tr.isAncestorOf === 'function' && tr.isAncestorOf(t));
    const isHandle = t?.name?.() === 'dent-handle' || t?.name?.() === 'handle-plus' || (t?.getParent?.()?.name?.() === 'dent-handle') || (t?.getParent?.()?.name?.() === 'handle-plus');
    if (isTransformer || isHandle) return;
    const isContentGroup = contentGroup && t === contentGroup;
    const isLayer = t?.getType && t.getType() === 'Layer';
    const isLayerDents = layerDents && t === layerDents;
    if (isStage || isBackground || isContentGroup || isLayer || isLayerDents) {
      tr.nodes([]);
      if (useMmMode) {
        activeDent = null;
        if (handleGroup) handleGroup.visible(false);
      }
      const layer = layerDents?.getLayer ? layerDents.getLayer() : layerDents;
      if (layer) layer.batchDraw();
      if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(null);
    }
  });

  const drawLayer = layerDents.getLayer ? layerDents.getLayer() : layerDents;
  if (drawLayer) drawLayer.batchDraw();

  /** ResizeObserver: при изменении размеров контейнера — resize + fit. */
  if (resizeObserverRef && resizeObservedEl) {
    resizeObserverRef.unobserve(resizeObservedEl);
    resizeObserverRef = null;
    resizeObservedEl = null;
  }
  resizeObservedEl = containerEl;
  resizeObserverRef = new ResizeObserver(() => {
    scheduleFit('resize-observer');
  });
  resizeObserverRef.observe(containerEl);

  /** window resize — запасной вариант (orientation, virtual keyboard и т.д.). */
  windowResizeHandler = () => scheduleFit('window-resize');
  window.addEventListener('resize', windowResizeHandler);
}


/**
 * A) applyBounds(node, opts) — ограничивает позицию вмятины bbox детали + margin (в stage-координатах).
 * Использует gridRect (если есть) как bounds, иначе imageNode.
 * opts: { marginPx } (по умолчанию BOUNDS_MARGIN_PX).
 */
function applyBounds(node, opts = {}) {
  if (!stage || !contentGroup) return;
  const marginPx = gridRectRef ? (opts.marginPx ?? 0) : (opts.marginPx ?? BOUNDS_MARGIN_PX);
  let partRect;
  if (gridRectRef) {
    const s = contentGroup.scaleX();
    const pos = contentGroup.position();
    partRect = {
      x: pos.x + gridRectRef.x * s,
      y: pos.y + gridRectRef.y * s,
      width: gridRectRef.width * s,
      height: gridRectRef.height * s
    };
  } else if (imageNode) {
    partRect = imageNode.getClientRect({ relativeTo: stage });
  } else {
    return;
  }
  const expanded = {
    left: partRect.x - marginPx,
    top: partRect.y - marginPx,
    right: partRect.x + partRect.width + marginPx,
    bottom: partRect.y + partRect.height + marginPx
  };
  const dentRect = node.getClientRect({ relativeTo: stage });
  const dentLeft = dentRect.x;
  const dentTop = dentRect.y;
  const dentRight = dentRect.x + dentRect.width;
  const dentBottom = dentRect.y + dentRect.height;
  let dx = 0;
  let dy = 0;
  if (dentLeft < expanded.left) dx = expanded.left - dentLeft;
  else if (dentRight > expanded.right) dx = expanded.right - dentRight;
  if (dentTop < expanded.top) dy = expanded.top - dentTop;
  else if (dentBottom > expanded.bottom) dy = expanded.bottom - dentBottom;
  if (dx === 0 && dy === 0) return;
  const parent = node.getParent();
  if (!parent) return;
  const inv = parent.getAbsoluteTransform().copy().invert();
  const p0 = inv.point({ x: 0, y: 0 });
  const p1 = inv.point({ x: dx, y: dy });
  const localDx = p1.x - p0.x;
  const localDy = p1.y - p0.y;
  node.x(node.x() + localDx);
  node.y(node.y() + localDy);
}

/** Меньшая сторона фигуры в px (в координатах stage) для hit/stroke. Использует Math.abs. */
function getDentMinSizePx(shape) {
  if (!shape) return 20;
  if (shape.className === 'Line') {
    const rect = shape.getClientRect({ relativeTo: shape.getParent() });
    return Math.min(rect.width || 0, rect.height || 0) || 20;
  }
  const scaleX = Math.max(0.01, Math.abs(shape.scaleX()));
  const scaleY = Math.max(0.01, Math.abs(shape.scaleY()));
  let sizePx;
  if (shape.className === 'Ellipse') {
    const dx = Math.abs(shape.radiusX()) * scaleX * 2;
    const dy = Math.abs(shape.radiusY()) * scaleY * 2;
    sizePx = Math.min(dx, dy);
  } else {
    sizePx = Math.min(Math.abs(shape.width()) * scaleX, Math.abs(shape.height()) * scaleY);
  }
  return sizePx;
}

/**
 * B) updateHitArea(shape) — hit area «чуть больше вмятины», с учётом scale (в stage px).
 */
function updateHitArea(shape) {
  if (!shape || !contentGroup) return;
  const scaleVal = contentGroup.scaleX();
  const sizePx = getDentMinSizePx(shape);
  const sizeStage = sizePx * scaleVal;
  const baseHit = Math.max(HIT_SIZE_MIN, Math.min(HIT_SIZE_MAX, sizeStage * HIT_SIZE_RATIO));
  const hit = Math.max(2, baseHit / scaleVal);
  shape.hitStrokeWidth(hit);
}

/**
 * C) updateStroke(shape) — тонкий stroke для маленьких вмятин, с учётом scale (размер в stage px).
 */
function updateStroke(shape) {
  if (!shape || !contentGroup) return;
  const scaleVal = contentGroup.scaleX();
  const sizePx = getDentMinSizePx(shape);
  const sizeStage = sizePx * scaleVal;
  const baseStroke = sizeStage < 40 ? STROKE_THIN : STROKE_NORMAL;
  const strokeWidth = Math.max(STROKE_MIN, Math.min(STROKE_MAX, baseStroke / scaleVal));
  shape.strokeWidth(strokeWidth);
}

/** Доп. тонкий stroke для маленьких dents: max(0.6, 1.2/scale). */
function updateDentStyle(dent) {
  if (!dent || !contentGroup) return;
  const s = contentGroup.scaleX();
  dent.strokeWidth(Math.max(0.6, 1.2 / s));
}



/** Микро-коэффициент (0.99) чтобы избежать обрезания на 1px по краям. */
const FIT_MICRO_GAP = 0.99;

/**
 * fitPartToStage(mode): авто-масштаб детали максимально крупно.
 * mode = 'fitWidth' (по умолчанию): приоритет — занять почти всю ширину, центрировать по высоте.
 * Если при scaleX деталь по высоте не помещается — fallback на contain (min(scaleX, scaleY)).
 */
function computeFitTransform(vw, vh, mode = 'fitWidth') {
  if (!contentWidth || !contentHeight || vw <= 0 || vh <= 0) {
    return { scaleFit: 1, posFit: { x: 0, y: 0 } };
  }
  const scaleX = vw / contentWidth;
  const scaleY = vh / contentHeight;
  let scaleFit;
  if (mode === 'fitWidth') {
    scaleFit = scaleX;
    if (contentHeight * scaleX > vh) {
      scaleFit = Math.min(scaleX, scaleY);
    }
  } else {
    scaleFit = Math.min(scaleX, scaleY);
  }
  scaleFit *= FIT_MICRO_GAP;
  if (!Number.isFinite(scaleFit) || scaleFit <= 0) scaleFit = 1;
  const scaledW = contentWidth * scaleFit;
  const scaledH = contentHeight * scaleFit;
  const posFit = {
    x: (vw - scaledW) / 2,
    y: (vh - scaledH) / 2
  };
  return { scaleFit, posFit };
}

/** Применить автоматический fit transform на contentGroup и перерисовать. */
function applyTransform() {
  if (!contentGroup || !stage) return;
  contentGroup.scale({ x: baseScale, y: baseScale });
  contentGroup.position({ x: basePos.x, y: basePos.y });
  if (layerDents) {
    const children = layerDents.getChildren ? layerDents.getChildren() : [];
    children.forEach((node) => {
      if (node !== tr && node.getAttr?.('name') === 'dent') {
        updateStroke(node);
        updateHitArea(node);
        updateDentStyle(node);
      }
    });
  }
  updateHandleStyle();
  if (freeformEditMode && freeformEditTarget) updateFreeformEditHandles(freeformEditTarget);
  debugFreeformState('fit');
  const layer = contentGroup.getLayer();
  if (layer) layer.batchDraw();
}


/** Включить/выключить сохранение пропорций при растягивании выбранной вмятины (свободное растяжение). */
/** Set display unit for dimension labels in dents ('mm' | 'cm'). Refreshes all visible labels. */
export function setDisplayUnit(unit) {
  displayUnit = unit === 'cm' ? 'cm' : 'mm';
  if (!layerDents || !useMmMode || !pxPerMm) return;
  const children = layerDents.getChildren ? layerDents.getChildren() : [];
  for (const node of children) {
    if (node.getAttr?.('name') === 'dent' && node !== tr && node !== handleGroup) {
      const shape = getDentShape(node);
      if (shape) {
        const bbox = getShapeRectLocal(shape);
        const widthMm = (bbox?.width ?? 0) / pxPerMm;
        const heightMm = (bbox?.height ?? 0) / pxPerMm;
        updateDentDimLabel(node, widthMm, heightMm);
      }
    }
  }
  const layer = layerDents.getLayer ? layerDents.getLayer() : null;
  if (layer) layer.batchDraw();
}

export function setKeepRatio(keepRatio) {
  transformerKeepRatio = !!keepRatio;
  if (tr) tr.keepRatio(transformerKeepRatio);
}

/**
 * Включить/выключить интерактивность редактора (режим "только просмотр" на шаге "Условия").
 * Когда false: никакой drag, resize, rotate, выделения; stage не реагирует на клики/тапы.
 * step: 1=Размещение (форма draggable, handle "плюс" тоже, без Transformer); 2+=полное редактирование.
 */
export function setEditorInteractive(interactive, step = 2) {
  if (!stage) return;
  wizardStep = step;
  stage.listening(!!interactive);
  /** На этапе 1: Transformer скрыт (нет квадратов/ручек resize). На этапе 2+: показываем. */
  if (tr) {
    if (step <= 2 || !interactive) {
      tr.nodes([]);
      tr.visible(false);
    } else {
      tr.visible(true);
      if (activeDent && canShowTransformerForNode(activeDent)) {
        const meta = activeDent._dentMeta;
        if (meta?.type === 'freeform') {
          if (meta?.isShapeFixed) tr.keepRatio(true);
          else tr.keepRatio(!meta?.isFreeStretchEnabled);
        } else {
          tr.keepRatio(transformerKeepRatio);
        }
        tr.nodes([activeDent]);
      }
      else tr.nodes([]);
    }
  }
  if (handleGroup) {
    handleGroup.visible(!!interactive && !!activeDent);
  }
  if (!interactive) {
    clearFreeformEditHandles();
  } else if (freeformEditMode) {
    updateFreeformEditHandles(getActiveNode());
  }
  /** На этапе 1: сетка скрыта. На этапах 2/3 — показываем, кроме мобильной версии. */
  if (layerGrid) layerGrid.visible(GRID_ENABLED && step !== 1 && !hideGridOnMobile);
  /** На этапах 1–2: форма draggable (и за саму вмятину, и за крестик). */
  const shapeDraggable = !!interactive;
  const children = layerDents?.getChildren?.() || [];
  children.forEach((node) => {
    if (node !== tr && node !== handleGroup && node.getAttr?.('name') === 'dent') {
      node.draggable(shapeDraggable);
    }
  });
  /** Handle "плюс": draggable только когда interactive (этапы 1–2). */
  const plusGroup = handleGroup?.getChildren?.()?.[1];
  if (plusGroup && plusGroup.getAttr?.('name') === 'handle-plus') plusGroup.draggable(!!interactive);
  const layer = layerDents?.getLayer ? layerDents.getLayer() : layerDents;
  if (layer) layer.batchDraw();
}

/**
 * Включить/выключить редактирование.
 * editable=true, step=1: форма draggable (и за крестик, и за саму вмятину).
 * editable=true, step>=2: форма draggable (текущая логика).
 * editable=false: только отрисовка.
 */
export function setEditable(editable, step = 2) {
  setEditorInteractive(!!editable, editable ? step : 2);
}

/** Скрыть сетку на мобильных (ширина < 480px). Вызывать при resize. */
export function setHideGridOnMobile(hide) {
  hideGridOnMobile = !!hide;
  if (layerGrid) {
    layerGrid.visible(GRID_ENABLED && wizardStep !== 1 && !hideGridOnMobile);
    const layer = layerGrid.getLayer ? layerGrid.getLayer() : null;
    if (layer) layer.batchDraw();
  }
}

/**
 * Обновить размер stage при изменении контейнера; обновляет bgRect.
 */
export function resizeStage(w, h) {
  if (!stage || w <= 0 || h <= 0) return;
  stage.width(w);
  stage.height(h);
  stageBounds = { x: 0, y: 0, width: w, height: h };
  if (bgRect) {
    bgRect.width(w);
    bgRect.height(h);
  }
  const layer = layerDents ? (layerDents.getLayer ? layerDents.getLayer() : layerDents) : null;
  if (layer) layer.batchDraw();
}

/**
 * Загрузить фото как фон (режим «Произвольно»).
 * Фото добавляется в contentGroup вместо детали — система координат совпадает с рисованием.
 * pxPerMm не задаётся (размеры вводит пользователь вручную).
 * @param {Blob} blob
 * @returns {Promise<{width:number,height:number}>} размеры оригинала
 */
export function setPhotoBackground(blob) {
  return new Promise((resolve, reject) => {
    if (!stage || !blob || !contentGroup || !layerParts) {
      resolve({ width: 0, height: 0 });
      return;
    }
    clearPhotoBackground();
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.onload = () => {
      try {
        layerParts.destroyChildren();
        layerParts.visible(true);
        photoImageNode = new Konva.Image({
          image: img,
          x: 0,
          y: 0,
          width: img.width,
          height: img.height,
          listening: false
        });
        layerParts.add(photoImageNode);

        contentWidth = img.width;
        contentHeight = img.height;
        imageRect = { x: 0, y: 0, width: img.width, height: img.height };
        pxPerMm = null;
        imageNode = null;
        gridRectRef = null;
        partBounds = { x: 0, y: 0, width: img.width, height: img.height };
        if (contentGroup.clip()) contentGroup.clip(null);
        if (layerGrid) layerGrid.visible(false);

        lastFitW = 0;
        lastFitH = 0;
        doResizeAndFitOnce();

        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Photo load failed'));
    };
    img.src = url;
  });
}

export function clearPhotoBackground() {
  if (photoImageNode) {
    photoImageNode.destroy();
    photoImageNode = null;
  }
  layerPhoto = null;
  if (layerGrid) layerGrid.visible(true);
  if (contentGroup) contentGroup.batchDraw();
}

/**
 * Resize stage to current container dimensions (getBoundingClientRect для точности).
 * Для fullscreen/fit вызывать scheduleFit.
 */
export function resizeStageToContainer() {
  const el = containerRef || (stage && stage.container && stage.container());
  if (!stage || !el) return;
  const rect = el.getBoundingClientRect();
  const w = Math.round(rect.width) || el.clientWidth || el.offsetWidth;
  const h = Math.round(rect.height) || el.clientHeight || el.offsetHeight;
  if (w <= 0 || h <= 0) return;
  resizeStage(w, h);
}

/**
 * Один раз: resize контейнера + пересчёт fit-to-width transform. Без дерганий.
 * Если размеры изменились не больше чем на FIT_SIZE_TOLERANCE_PX (напр. скроллбар/модалка) — basePos/baseScale не трогаем, вид статичен.
 */
function doResizeAndFitOnce() {
  resizeStageToContainer();
  if (!contentGroup || contentWidth <= 0 || contentHeight <= 0) return;
  const vw = stage.width();
  const vh = stage.height();
  const tol = FIT_SIZE_TOLERANCE_PX;
  const sizeUnchanged = lastFitW > 0 && lastFitH > 0 &&
    Math.abs(vw - lastFitW) <= tol && Math.abs(vh - lastFitH) <= tol;
  if (sizeUnchanged) {
    applyTransform();
    return;
  }
  lastFitW = vw;
  lastFitH = vh;
  const fit = computeFitTransform(vw, vh, 'fitWidth');
  baseScale = fit.scaleFit;
  basePos = { x: fit.posFit.x, y: fit.posFit.y };
  applyTransform();
}

/**
 * Запланировать один fit-to-width на следующий RAF (вход/выход fullscreen, resize, orientationchange).
 */
export function scheduleFit(reason) {
  if (fitPending) return;
  fitPending = true;
  requestAnimationFrame(() => {
    fitPending = false;
    doResizeAndFitOnce();
  });
}

function initLegacyPathPart(w, h) {
  const scaleX = w / 320;
  const scaleY = h / 420;
  const scale = Math.min(scaleX, scaleY);
  const partShape = new Konva.Path({
    data: selectedPart.path,
    fill: '#151F2E',
    stroke: '#334155',
    strokeWidth: 3 / scale,
    shadowColor: 'black',
    shadowBlur: 20,
    shadowOpacity: 0.5,
    scaleX: scale,
    scaleY: scale,
    x: (w - 300 * scale) / 2,
    y: (h - 400 * scale) / 2,
    name: 'partPath'
  });
  layerParts.add(partShape);
  partBounds = partShape.getClientRect();

  if (selectedPart.ribs && selectedPart.ribs.length) {
    selectedPart.ribs.forEach((rib) => {
      const ribRect = new Konva.Rect({
        x: rib.x * scale + partShape.x(),
        y: rib.y * scale + partShape.y(),
        width: rib.w * scale,
        height: rib.h * scale,
        fill: 'rgba(255, 50, 50, 0.25)',
        stroke: 'rgba(255, 50, 50, 0.5)',
        strokeWidth: 1,
        name: 'rib',
        listening: false
      });
      layerParts.add(ribRect);
    });
  }
}

async function initImagePart(stageW, stageH) {
  const realW = selectedPart.realSizeMm.w;
  const realH = selectedPart.realSizeMm.h;
  const src = selectedPart.asset.src;

  let imgNode = null;
  let dispW = 0;
  let dispH = 0;
  let imgForBbox = null;

  try {
    let img = await loadPartImage(src);
    if (REMOVE_WHITE_BACKGROUND) {
      try {
        img = await removeWhiteBackground(img);
      } catch (_) {
        // fallback: use original image
      }
    }
    imgForBbox = img;
    const natW = img.naturalWidth || img.width;
    const natH = img.naturalHeight || img.height;
    const bbox = computeAlphaBounds(img, 10);
    dispW = bbox.width;
    dispH = bbox.height;
    pxPerMm = Math.min(dispW / realW, dispH / realH) || 0.1;

    const underlay = new Konva.Rect({
      x: 0,
      y: 0,
      width: dispW,
      height: dispH,
      fill: 'rgba(255,255,255,0.03)',
      listening: false
    });
    layerParts.add(underlay);
    imgNode = new Konva.Image({
      image: img,
      x: 0,
      y: 0,
      width: dispW,
      height: dispH,
      crop: { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height },
      shadowColor: 'black',
      shadowBlur: 18,
      shadowOpacity: 0.45,
      name: 'partImage',
      listening: false
    });
    imgNode.setAttr('isBackground', true);
    layerParts.add(imgNode);
    imageNode = imgNode;
  } catch (e) {
    dispW = Math.min(300, stageW);
    dispH = Math.min(400, stageH);
    pxPerMm = Math.min(dispW / realW, dispH / realH) || 0.1;
    imgNode = new Konva.Rect({
      x: 0,
      y: 0,
      width: dispW,
      height: dispH,
      fill: '#2a2a2a',
      stroke: '#444',
      strokeWidth: 2,
      name: 'partPlaceholder',
      listening: false
    });
    imgNode.setAttr('isBackground', true);
    layerParts.add(imgNode);
    const label = new Konva.Text({
      text: selectedPart.name || 'Деталь',
      fontSize: 16,
      fill: '#888',
      width: 280,
      padding: 10,
      align: 'center',
      listening: false
    });
    label.position({ x: 10, y: (dispH - label.height()) / 2 });
    layerParts.add(label);
    imageNode = imgNode;
  }

  imageRect = { x: 0, y: 0, width: dispW, height: dispH };
  gridRectRef = null;

  const gridRect = { x: 0, y: 0, width: dispW, height: dispH };
  gridRectRef = gridRect;
  partBounds = gridRect;
  drawGridStage(gridRect.x, gridRect.y, gridRect.width, gridRect.height);
  heatZonesPx = [];
  // TODO: heatZones temporarily disabled — re-enable drawHeatZonesStage when zones are corrected

  const layer = layerParts.getLayer();
  if (layer) layer.batchDraw();
}

/** Сетка 30×30 мм. (x,y,dispW,dispH) — область отрисовки в координатах contentGroup. Линии выравниваются по глобальной сетке (0,0). */
function drawGridStage(x, y, dispW, dispH) {
  if (!GRID_ENABLED) {
    if (layerGrid) {
      layerGrid.destroyChildren();
      layerGrid.visible(false);
      const layer = layerGrid.getLayer ? layerGrid.getLayer() : null;
      if (layer) layer.batchDraw();
    }
    return;
  }
  if (!layerGrid || pxPerMm == null || dispW <= 0 || dispH <= 0) return;
  layerGrid.destroyChildren();
  const cellPx = CELL_MM * pxPerMm;
  const firstCol = Math.floor(x / cellPx);
  const lastCol = Math.ceil((x + dispW) / cellPx);
  const firstRow = Math.floor(y / cellPx);
  const lastRow = Math.ceil((y + dispH) / cellPx);
  for (let i = firstCol; i <= lastCol; i++) {
    const lx = i * cellPx;
    const line = new Konva.Line({
      points: [lx, y, lx, y + dispH],
      stroke: 'rgba(255,255,255,0.06)',
      strokeWidth: 1,
      strokeScaleEnabled: false,
      listening: false
    });
    line.setAttr('isBackground', true);
    layerGrid.add(line);
  }
  for (let j = firstRow; j <= lastRow; j++) {
    const ly = j * cellPx;
    const line = new Konva.Line({
      points: [x, ly, x + dispW, ly],
      stroke: 'rgba(255,255,255,0.06)',
      strokeWidth: 1,
      strokeScaleEnabled: false,
      listening: false
    });
    line.setAttr('isBackground', true);
    layerGrid.add(line);
  }
  const layer = layerGrid.getLayer();
  if (layer) layer.batchDraw();
}

/** HeatZones в координатах stage (displayRect offset + мм → px). */
function drawHeatZonesStage(dispX, dispY) {
  heatZonesPx = [];
  const zones = selectedPart.heatZones || selectedPart.ribs;
  if (!zones || !zones.length || !pxPerMm) return;
  zones.forEach((z) => {
    const xPx = dispX + (z.xMm ?? z.x ?? 0) * pxPerMm;
    const yPx = dispY + (z.yMm ?? z.y ?? 0) * pxPerMm;
    const wPx = (z.wMm ?? z.w ?? 0) * pxPerMm;
    const hPx = (z.hMm ?? z.h ?? 0) * pxPerMm;
    heatZonesPx.push({ x: xPx, y: yPx, width: wPx, height: hPx, mult: z.mult ?? RIB_MULTIPLIER });
    const rect = new Konva.Rect({
      x: xPx,
      y: yPx,
      width: wPx,
      height: hPx,
      fill: 'rgba(255,0,0,0.18)',
      stroke: 'rgba(255,0,0,0.45)',
      strokeWidth: 1,
      name: 'heatZone',
      listening: false
    });
    layerParts.add(rect);
  });
  const layer = layerParts.getLayer();
  if (layer) layer.batchDraw();
}

function getInterpolatedPriceByAreaMm2(areaMm2, type, sizesWithArea) {
  return interpolateByAreaMm2(areaMm2, sizesWithArea, prices);
}

function getInterpolatedPriceByAreaPx(areaPx, type, sizes) {
  if (!sizes || sizes.length === 0) return 0;
  const sorted = [...sizes].sort((a, b) => (a.area || 0) - (b.area || 0));
  if (sorted[0].area != null && areaPx <= sorted[0].area) return prices[sorted[0].code] ?? sorted[0].basePrice ?? 0;
  const last = sorted[sorted.length - 1];
  const areaMax = last.area ?? 0;
  const priceMax = prices[last.code] ?? last.basePrice ?? 42000;
  if (areaPx <= areaMax) {
    for (let i = 0; i < sorted.length - 1; i++) {
      const s1 = sorted[i];
      const s2 = sorted[i + 1];
      const a1 = s1.area ?? 0;
      const a2 = s2.area ?? 0;
      if (a2 > a1 && areaPx >= a1 && areaPx <= a2) {
        const p1 = prices[s1.code] ?? s1.basePrice ?? 0;
        const p2 = prices[s2.code] ?? s2.basePrice ?? 0;
        const ratio = (areaPx - a1) / (a2 - a1);
        return p1 + (p2 - p1) * ratio;
      }
    }
    return priceMax;
  }
  /** Площадь > макс. пресета: убираем потолок. Условия считаются от фактической предварительной цены. */
  const extraArea = areaPx - areaMax;
  const markup = Math.max(500, 5000 * Math.log(1 + extraArea / 50000));
  return priceMax + markup;
}

function rectIntersectionArea(a, b) {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const w = Math.max(0, right - left);
  const h = Math.max(0, bottom - top);
  return w * h;
}

function polygonArea(points) {
  if (!points || points.length < 6) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i += 2) {
    const x1 = points[i];
    const y1 = points[i + 1];
    const j = (i + 2) % points.length;
    const x2 = points[j];
    const y2 = points[j + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function ellipseAreaByMm(w, h) {
  return Math.PI * (w / 2) * (h / 2);
}

function getClosestSizeCodeByArea(sizes, area, areaKey = 'areaMm2') {
  if (!sizes || sizes.length === 0 || !Number.isFinite(area)) return null;
  let closest = null;
  let minDist = Infinity;
  for (const s of sizes) {
    const a = Number(s?.[areaKey]);
    if (!Number.isFinite(a)) continue;
    const d = Math.abs(a - area);
    if (d < minDist) {
      minDist = d;
      closest = s;
    }
  }
  return closest?.code || null;
}

function getClosestSizeCodeByMm(sizes, widthMm, heightMm) {
  if (!sizes || sizes.length === 0) return null;
  const areaMm2 = ellipseAreaByMm(widthMm, heightMm);
  const withArea = sizes.map((s) => {
    if (Number.isFinite(s?.areaMm2)) return s;
    if (s?.mm?.w && s?.mm?.h) {
      return { ...s, areaMm2: ellipseAreaByMm(s.mm.w, s.mm.h) };
    }
    return s;
  });
  return getClosestSizeCodeByArea(withArea, areaMm2, 'areaMm2');
}

function getLineLocalBounds(line) {
  const pts = line?.points?.() || [];
  if (pts.length < 2) return { minX: 0, minY: 0, width: 0, height: 0 };
  let minX = pts[0];
  let minY = pts[1];
  let maxX = pts[0];
  let maxY = pts[1];
  for (let i = 2; i < pts.length; i += 2) {
    const x = pts[i];
    const y = pts[i + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, width: Math.max(0, maxX - minX), height: Math.max(0, maxY - minY) };
}

function normalizeLinePointsToTopLeft(line) {
  if (!line) return;
  const pts = line.points?.() || [];
  if (pts.length < 2) return;
  const bounds = getLineLocalBounds(line);
  if (bounds.minX === 0 && bounds.minY === 0) return;
  const next = [];
  for (let i = 0; i < pts.length; i += 2) {
    next.push(pts[i] - bounds.minX, pts[i + 1] - bounds.minY);
  }
  line.points(next);
  line.position({ x: line.x() + bounds.minX, y: line.y() + bounds.minY });
}

function ensureFreeformEditGroup() {
  if (!layerDents) return;
  if (freeformEditGroup) return;
  freeformEditGroup = new Konva.Group({ name: 'freeform-edit', listening: true });
  layerDents.add(freeformEditGroup);
}

function clearFreeformEditHandles() {
  if (!freeformEditGroup) return;
  freeformEditGroup.destroyChildren();
  freeformEditGroup.visible(false);
  freeformEditTarget = null;
}

function updateFreeformEditHandles(line) {
  if (!freeformEditMode || !line || line.className !== 'Line' || !line._dentMeta?.freeformEnabled) {
    clearFreeformEditHandles();
    return;
  }
  ensureFreeformEditGroup();
  freeformEditTarget = line;
  freeformEditGroup.visible(true);
  freeformEditGroup.position(line.position());
  const pts = line.points?.() || [];
  const handleScale = contentGroup ? 1 / Math.max(0.01, contentGroup.scaleX()) : 1;
  freeformEditGroup.destroyChildren();
  for (let i = 0; i < pts.length; i += 2) {
    const idx = i / 2;
    const isActive = line._dentMeta?.activeFreeformPointIndex === idx;
    const handle = new Konva.Circle({
      x: pts[i],
      y: pts[i + 1],
      radius: FREEFORM_POINT_RADIUS,
      fill: isActive ? '#88E523' : 'rgba(255,255,255,0.6)',
      stroke: '#88E523',
      strokeWidth: 1,
      hitStrokeWidth: FREEFORM_POINT_HIT_RADIUS,
      draggable: true,
      name: 'freeform-point'
    });
    handle.scale({ x: handleScale, y: handleScale });
    let pressTimer = null;
    handle.on('mousedown touchstart', (e) => {
      e.cancelBubble = true;
      if (contentGroup) contentGroup.draggable(false);
      if (line._dentMeta) line._dentMeta.activeFreeformPointIndex = idx;
      updateFreeformEditHandles(line);
      pressTimer = setTimeout(() => {
        if (pressTimer) {
          pressTimer = null;
          deleteFreeformPointAtIndex(line, idx);
        }
      }, FREEFORM_LONG_PRESS_MS);
    });
    handle.on('dragstart', (e) => {
      e.cancelBubble = true;
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    });
    handle.on('dragmove', () => {
      if (!line) return;
      const cur = line.points?.() || [];
      cur[i] = handle.x();
      cur[i + 1] = handle.y();
      line.points(cur);
      updateShapeCalc(line, line._dentMeta.baseType, line._dentMeta.id, line._dentMeta.sizes);
      if (useMmMode && handleGroup) positionHandle(line);
      const layer = layerDents?.getLayer ? layerDents.getLayer() : layerDents;
      if (layer) layer.batchDraw();
    });
    handle.on('dragend', () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      normalizeLinePointsToTopLeft(line);
      updateFreeformEditHandles(line);
      updateShapeCalc(line, line._dentMeta.baseType, line._dentMeta.id, line._dentMeta.sizes);
      if (useMmMode && handleGroup) positionHandle(line);
    });
    handle.on('click tap', (e) => {
      e.cancelBubble = true;
      if (line._dentMeta) line._dentMeta.activeFreeformPointIndex = idx;
      updateFreeformEditHandles(line);
    });
    freeformEditGroup.add(handle);
  }
  const layer = layerDents?.getLayer ? layerDents.getLayer() : layerDents;
  if (layer) layer.batchDraw();
}

function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return { dist: Math.hypot(px - x1, py - y1), t: 0 };
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const cx = x1 + clamped * dx;
  const cy = y1 + clamped * dy;
  return { dist: Math.hypot(px - cx, py - cy), t: clamped, x: cx, y: cy };
}

function insertPointAtPointer(line, pointer) {
  if (!line || !pointer) return;
  const pts = line.points?.() || [];
  if (pts.length < 6) return;
  const localX = pointer.x - line.x();
  const localY = pointer.y - line.y();
  let best = { dist: Infinity, insertIndex: -1, x: 0, y: 0 };
  const count = pts.length / 2;
  for (let i = 0; i < count; i++) {
    const i2 = (i + 1) % count;
    const x1 = pts[i * 2];
    const y1 = pts[i * 2 + 1];
    const x2 = pts[i2 * 2];
    const y2 = pts[i2 * 2 + 1];
    const hit = distancePointToSegment(localX, localY, x1, y1, x2, y2);
    if (hit.dist < best.dist) {
      best = { dist: hit.dist, insertIndex: i2, x: hit.x, y: hit.y };
    }
  }
  if (best.dist > FREEFORM_ADD_MAX_DIST) return;
  const next = [];
  for (let i = 0; i < count; i++) {
    if (i === best.insertIndex) {
      next.push(best.x, best.y);
    }
    next.push(pts[i * 2], pts[i * 2 + 1]);
  }
  line.points(next);
  if (line._dentMeta) line._dentMeta.activeFreeformPointIndex = best.insertIndex;
  updateShapeCalc(line, line._dentMeta.baseType, line._dentMeta.id, line._dentMeta.sizes);
  updateFreeformEditHandles(line);
}

function deleteFreeformPointAtIndex(line, index) {
  if (!line) return;
  const pts = line.points?.() || [];
  const count = pts.length / 2;
  if (count <= 3) return;
  if (index < 0 || index >= count) return;
  const next = [];
  for (let i = 0; i < count; i++) {
    if (i === index) continue;
    next.push(pts[i * 2], pts[i * 2 + 1]);
  }
  line.points(next);
  if (line._dentMeta) line._dentMeta.activeFreeformPointIndex = null;
  normalizeLinePointsToTopLeft(line);
  updateShapeCalc(line, line._dentMeta.baseType, line._dentMeta.id, line._dentMeta.sizes);
  updateFreeformEditHandles(line);
}

export function setFreeformEditMode(enabled) {
  freeformEditMode = !!enabled;
  const node = getActiveNode();
  if (freeformEditMode && node && node.className === 'Line' && node._dentMeta?.freeformEnabled) {
    updateFreeformEditHandles(node);
  } else {
    clearFreeformEditHandles();
  }
}

export function deleteActiveFreeformPoint() {
  const node = getActiveNode();
  if (!node || node.className !== 'Line' || !node._dentMeta) return;
  const idx = node._dentMeta.activeFreeformPointIndex;
  if (typeof idx !== 'number') return;
  deleteFreeformPointAtIndex(node, idx);
}

function debugFreeformState(label) {
  if (!import.meta.env?.DEV) return;
  const node = getActiveNode();
  if (!node || node.className !== 'Line' || !node._dentMeta?.freeformEnabled) return;
  const pts = node.points?.() || [];
  const bounds = getLineLocalBounds(node);
  console.debug('[freeform]', label, {
    id: node._dentMeta.id,
    pos: node.position(),
    points: pts.length,
    bounds
  });
}

/** Возвращает локальный rect фигуры; всегда положительные width/height (через Math.abs). */
function getShapeRectLocal(shapeOrNode) {
  const shape = getDentShape(shapeOrNode) || shapeOrNode;
  if (!shape) return { x: 0, y: 0, width: 0, height: 0 };
  const scaleX = Math.abs(shape.scaleX()) || 1;
  const scaleY = Math.abs(shape.scaleY()) || 1;
  if (shape.className === 'Line') {
    const bounds = getLineLocalBounds(shape);
    return {
      x: shape.x() + bounds.minX,
      y: shape.y() + bounds.minY,
      width: bounds.width,
      height: bounds.height
    };
  }
  if (shape.className === 'Ellipse') {
    const rx = Math.abs(shape.radiusX() * scaleX);
    const ry = Math.abs(shape.radiusY() * scaleY);
    return {
      x: shape.x() - rx,
      y: shape.y() - ry,
      width: rx * 2,
      height: ry * 2
    };
  }
  const w = Math.abs(shape.width() * scaleX);
  const h = Math.abs(shape.height() * scaleY);
  const ox = shape.offsetX ? shape.offsetX() : 0;
  const oy = shape.offsetY ? shape.offsetY() : 0;
  return {
    x: shape.x() - (Math.abs(ox * scaleX) || w / 2),
    y: shape.y() - (Math.abs(oy * scaleY) || h / 2),
    width: w,
    height: h
  };
}

/** Пересчёт площади и цены вмятины; использует Math.abs для защиты от инверсии. */
function updateShapeCalc(shape, type, id, sizes) {
  if (!shape || !stage) return;
  const meta = shape._dentMeta || {};
  const baseType = meta.baseType || type;
  const isFreeform = isFreeformMeta(meta);
  const isFreeformType = meta?.type === 'freeform';

  // Используем абсолютные значения scale для корректного расчёта площади (защита от NaN/undefined)
  const scaleX = Math.max(0.01, Math.abs(normalizeNumber(shape.scaleX(), 1)));
  const scaleY = Math.max(0.01, Math.abs(normalizeNumber(shape.scaleY(), 1)));
  let areaPxGeom = 0;
  if (isFreeform) {
    const pts = shape.points ? shape.points() : [];
    areaPxGeom = polygonArea(pts);
  } else if (shape.className === 'Ellipse') {
    areaPxGeom = Math.PI * Math.abs(shape.radiusX() * scaleX) * Math.abs(shape.radiusY() * scaleY);
  } else {
    areaPxGeom = Math.abs(shape.width() * scaleX) * Math.abs(shape.height() * scaleY);
  }

  const bbox = getShapeRectLocal(shape);
  const areaPxForPrice = isFreeform ? Math.max(0, (bbox?.width ?? 0) * (bbox?.height ?? 0)) : areaPxGeom;
  let areaMm2 = null;
  let areaMm2ForPrice = null;
  let cellsCount = null;
  const userBboxMm = (meta.userWidthMm != null && meta.userHeightMm != null)
    ? { width: meta.userWidthMm, height: meta.userHeightMm }
    : null;
  if (userBboxMm && isFreeformType) {
    areaMm2 = userBboxMm.width * userBboxMm.height;
    areaMm2ForPrice = areaMm2;
    if (CELL_MM > 0) cellsCount = areaMm2 / (CELL_MM * CELL_MM);
  } else if (useMmMode && pxPerMm != null && pxPerMm > 0) {
    areaMm2 = areaPxGeom / (pxPerMm * pxPerMm);
    areaMm2ForPrice = areaPxForPrice / (pxPerMm * pxPerMm);
    cellsCount = areaMm2 / (CELL_MM * CELL_MM);
  }

  let isComplex = false;
  let complexMult = 1;
  // TODO: heatZones temporarily disabled — re-enable when zones are corrected
  if (!useMmMode) {
    const shapeRect = shape.getClientRect();
    const ribs = stage.find('.rib');
    for (let rib of ribs) {
      if (Konva.Util.haveIntersection(rib.getClientRect(), shapeRect)) {
        isComplex = true;
        complexMult = RIB_MULTIPLIER;
        break;
      }
    }
  }

  let price;
  const typeForPrice = isFreeformType ? 'circle' : baseType;
  let sizeCode = 'STRIP_DEFAULT';
  const bboxMmForPrice = userBboxMm || (useMmMode && pxPerMm && bbox
    ? { width: (bbox?.width ?? 0) / pxPerMm, height: (bbox?.height ?? 0) / pxPerMm }
    : null);
  if (isFreeformType && bboxMmForPrice && sizes) {
    const wMm = bboxMmForPrice.width;
    const hMm = bboxMmForPrice.height;
    sizeCode = getClosestSizeCodeByMm(sizes, wMm, hMm) || 'S2';
    price = prices[sizeCode] ?? 0;
  } else if (useMmMode && areaMm2ForPrice != null && sizes && sizes[0] && sizes[0].areaMm2 != null) {
    price = getInterpolatedPriceByAreaMm2(areaMm2ForPrice, typeForPrice, sizes);
  } else {
    price = getInterpolatedPriceByAreaPx(areaPxForPrice, typeForPrice, sizes);
  }
  if (isComplex) price *= complexMult;

  /** sizeCode для матрицы сложности: круг — ближайший по площади, полоса — STRIP_DEFAULT */
  const typeForMatrix = baseType === 'circle' ? 'circle' : 'strip';
  if (!isFreeformType && typeForMatrix === 'circle' && sizes && sizes.length > 0) {
    const withArea = sizes.filter((s) => (s.areaMm2 ?? s.area) != null);
    if (withArea.length > 0) {
      const areaVal = areaMm2 ?? areaPx;
      sizeCode = getClosestSizeCodeByAreaMm2(areaVal, withArea) || 'S2';
    }
  }

  if (isFreeformType) {
    shape.stroke('#88E523');
    shape.fill('rgba(136, 229, 35, 0.2)');
  } else if (isComplex) {
    shape.stroke('#FF4444');
    shape.fill(typeForMatrix === 'circle' ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255, 68, 68, 0.3)');
  } else {
    shape.stroke(typeForMatrix === 'circle' ? '#88E523' : '#A0AEC0');
    shape.fill(typeForMatrix === 'circle' ? 'rgba(136, 229, 35, 0.3)' : 'rgba(200, 200, 200, 0.3)');
  }

  if (isFreeform && shape.points) {
    meta.freeformPoints = [...shape.points()];
  }

  const freeformPointsPx = isFreeform
    ? (meta.freeformPoints || []).reduce((acc, v, idx) => {
      if (idx % 2 === 0) acc.push({ x: v, y: meta.freeformPoints[idx + 1] });
      return acc;
    }, [])
    : undefined;

  const dentType = meta.type || baseType;
  const dentData = {
    id,
    type: dentType,
    sizeCode,
    photoAssetKey: meta.photoAssetKey ?? null,
    areaPx: areaPxGeom,
    areaMm2: areaMm2 ?? undefined,
    bboxPx: { width: bbox?.width ?? 0, height: bbox?.height ?? 0 },
    bboxMm: (userBboxMm || (useMmMode && pxPerMm && bbox))
      ? (userBboxMm || { width: (bbox?.width ?? 0) / pxPerMm, height: (bbox?.height ?? 0) / pxPerMm })
      : undefined,
    cellsCount: cellsCount != null ? Math.round(cellsCount * 100) / 100 : undefined,
    isComplex,
    price,
    rotation: shape.rotation ? shape.rotation() : 0,
    shapeKind: meta.shapeKind,
    freeformEnabled: isFreeform,
    freeformPoints: meta.freeformPoints,
    freeformPointsPx,
    isShapeFixed: meta.isShapeFixed === true,
    freeStretchEnabled: meta.isFreeStretchEnabled === true,
    fixedAspectRatio: Number.isFinite(meta.fixedAspectRatio) ? meta.fixedAspectRatio : null
  };
  dentsMap.set(id, dentData);
  if (onDentChangeCallback) {
    onDentChangeCallback(Array.from(dentsMap.values()));
  }
  const wMmForLabel = userBboxMm?.width ?? (useMmMode && pxPerMm ? (bbox?.width ?? 0) / pxPerMm : 0);
  const hMmForLabel = userBboxMm?.height ?? (useMmMode && pxPerMm ? (bbox?.height ?? 0) / pxPerMm : 0);
  if (useMmMode && (wMmForLabel > 0 || hMmForLabel > 0)) {
    updateDentDimLabel(shape, wMmForLabel, hMmForLabel);
  }
}

/**
 * Установить размеры вмятины из ручного ввода (режим фото без pxPerMm).
 * Физически масштабирует Line, чтобы форма визуально соответствовала введённым мм.
 * @param {number} widthMm
 * @param {number} heightMm
 */
export function setSelectedDentUserDimensions(widthMm, heightMm) {
  const node = getActiveNode();
  if (!node || !node._dentMeta || node._dentMeta.type !== 'freeform') return;
  const w = clamp(normalizeNumber(widthMm, 0), SIZE_MM_MIN, SIZE_MM_MAX);
  const h = clamp(normalizeNumber(heightMm, 0), SIZE_MM_MIN, SIZE_MM_MAX);
  const meta = node._dentMeta;

  if (node.className === 'Line' && node.points) {
    normalizeLinePointsToTopLeft(node);
    const bounds = getLineLocalBounds(node);
    const curW = Math.max(1, bounds.width);
    const curH = Math.max(1, bounds.height);
    const refW = (meta.userWidthMm != null && meta.userWidthMm > 0) ? meta.userWidthMm : curW;
    const refH = (meta.userHeightMm != null && meta.userHeightMm > 0) ? meta.userHeightMm : curH;
    const sx = w / refW;
    const sy = h / refH;
    const curPts = node.points();
    const next = [];
    for (let i = 0; i < curPts.length; i += 2) {
      next.push(curPts[i] * sx, curPts[i + 1] * sy);
    }
    node.points(next);
    meta.freeformPoints = [...next];
  }

  meta.userWidthMm = w;
  meta.userHeightMm = h;
  updateShapeCalc(node, meta.baseType, meta.id, meta.sizes);
  updateStroke(node);
  updateHitArea(node);
  if (handleGroup) positionHandle(node);
  const layer = node.getLayer();
  if (layer) layer.batchDraw();
  if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(getSelectedDentSizeMm());
}

/** Макс. размер по оси в мм для UI (защита от багов). */
const SIZE_MM_MAX = 2000;
const SIZE_MM_MIN = 0.1;
/** Порог для авто-выбора круга: |width - height| < 2 мм → круг. */
const CIRCLE_EQUAL_THRESHOLD_MM = 2;

/** Авто shapeVariant: ширина ≈ высота → круг, иначе овал. Для strip: ширина ≥ высота → полоса, иначе царапина. */
function inferShapeVariant(type, widthMm, heightMm) {
  const w = normalizeNumber(widthMm, 0);
  const h = normalizeNumber(heightMm, 0);
  if (type === 'freeform') return 'freeform';
  if (type === 'circle') {
    return Math.abs(w - h) < CIRCLE_EQUAL_THRESHOLD_MM ? 'circle' : 'oval';
  }
  return w >= h ? 'strip' : 'scratch';
}

function normalizeFreeformPoints(line, rect) {
  if (!line || !rect || rect.width <= 0 || rect.height <= 0) return [];
  const pts = line.points ? line.points() : [];
  const norm = [];
  for (let i = 0; i < pts.length; i += 2) {
    norm.push((pts[i] || 0) / rect.width, (pts[i + 1] || 0) / rect.height);
  }
  return norm;
}

/**
 * Размеры выбранной вмятины в мм (единый источник: pxPerMm в konvaEditor).
 * shapeVariant вычисляется автоматически: круг если width≈height, иначе овал.
 */
export function getSelectedDentSizeMm() {
  const node = getActiveNode();
  if (!node || !node._dentMeta || !useMmMode) return null;
  const meta = node._dentMeta;
  if (meta.type === 'freeform' && (pxPerMm == null || pxPerMm <= 0)) {
    const w = meta.userWidthMm ?? 0;
    const h = meta.userHeightMm ?? 0;
    return {
      id: meta.id,
      type: meta.type,
      shapeVariant: 'freeform',
      widthMm: w,
      heightMm: h,
      freeformEnabled: true,
      shapeKind: meta.shapeKind,
      areaMm2: w > 0 && h > 0 ? w * h : undefined,
      isShapeFixed: meta.isShapeFixed === true,
      freeStretchEnabled: meta.isFreeStretchEnabled === true,
      fixedAspectRatio: meta.fixedAspectRatio ?? null
    };
  }
  if (pxPerMm == null || pxPerMm <= 0) return null;
  const r = getShapeRectLocal(node);
  const wPx = normalizeNumber(r?.width, 0);
  const hPx = normalizeNumber(r?.height, 0);
  const px = Math.max(0.01, pxPerMm);
  const widthMm = clamp(wPx / px, SIZE_MM_MIN, SIZE_MM_MAX);
  const heightMm = clamp(hPx / px, SIZE_MM_MIN, SIZE_MM_MAX);
  const type = meta.type || meta.baseType;
  const shapeVariant = inferShapeVariant(type, widthMm, heightMm);
  meta.shapeVariant = shapeVariant;
  const areaPx = node.className === 'Line' ? polygonArea(node.points?.() || []) : null;
  const areaMm2 = areaPx != null ? areaPx / (px * px) : null;
  return {
    id: meta.id,
    type,
    shapeVariant,
    widthMm,
    heightMm,
    freeformEnabled: isFreeformMeta(meta),
    shapeKind: meta.shapeKind,
    areaMm2: areaMm2 ?? undefined,
    freeformPointCount: node.className === 'Line' ? Math.floor((node.points?.() || []).length / 2) : undefined,
    activeFreeformPointIndex: meta.activeFreeformPointIndex ?? null,
    isShapeFixed: meta.isShapeFixed === true,
    freeStretchEnabled: meta.isFreeStretchEnabled === true,
    fixedAspectRatio: Number.isFinite(meta.fixedAspectRatio) ? meta.fixedAspectRatio : null,
    freeformPointsPx: isFreeformMeta(meta)
      ? (meta.freeformPoints || []).reduce((acc, v, idx) => {
        if (idx % 2 === 0) acc.push({ x: v, y: meta.freeformPoints[idx + 1] });
        return acc;
      }, [])
      : undefined
  };
}

/**
 * Установить размеры выбранной вмятины по мм; центр сохраняется.
 * Вызывает applyBounds, updateShapeCalc, positionHandle.
 */
export function setSelectedDentSizeMm(widthMm, heightMm) {
  const node = getActiveNode();
  if (!node || !node._dentMeta || !useMmMode || pxPerMm == null || pxPerMm <= 0) return;
  const meta = node._dentMeta;
  /* freeform: разрешаем менять размер при ручном вводе (Своб. растяж. или зафиксирована форма) */
  const wMm = clamp(normalizeNumber(widthMm, SIZE_MM_MIN), SIZE_MM_MIN, SIZE_MM_MAX);
  const hMm = clamp(normalizeNumber(heightMm, SIZE_MM_MIN), SIZE_MM_MIN, SIZE_MM_MAX);
  const wPx = wMm * pxPerMm;
  const hPx = hMm * pxPerMm;
  if (node.className === 'Ellipse') {
    node.radiusX(wPx / 2);
    node.radiusY(hPx / 2);
  } else if (node.className === 'Line') {
    normalizeLinePointsToTopLeft(node);
    const bounds = getLineLocalBounds(node);
    const curW = Math.max(1, bounds.width);
    const curH = Math.max(1, bounds.height);
    const sx = wPx / curW;
    const sy = hPx / curH;
    const curPts = node.points?.() || [];
    const next = [];
    for (let i = 0; i < curPts.length; i += 2) {
      next.push(curPts[i] * sx, curPts[i + 1] * sy);
    }
    node.points(next);
    node._dentMeta.freeformPoints = [...next];
  } else {
    node.width(wPx);
    node.height(hPx);
    node.scaleX(1);
    node.scaleY(1);
    node.offsetX(wPx / 2);
    node.offsetY(hPx / 2);
  }
  if (useMmMode && imageNode) applyBounds(node);
  updateShapeCalc(node, meta.type, meta.id, meta.sizes);
  updateStroke(node);
  updateHitArea(node);
  if (useMmMode && handleGroup) positionHandle(node);
  const layer = node.getLayer();
  if (layer) layer.batchDraw();
  if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(getSelectedDentSizeMm());
}

export function setSelectedDentFreeStretch(enabled) {
  const node = getActiveNode();
  if (!node || !node._dentMeta) return;
  if (node._dentMeta.type !== 'freeform') return;
  if (node._dentMeta.isShapeFixed) return;
  node._dentMeta.isFreeStretchEnabled = !!enabled;
  if (tr && canShowTransformerForNode(node)) {
    tr.keepRatio(!enabled);
    tr.nodes([node]);
  }
  if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(getSelectedDentSizeMm());
}

/**
 * Установить вариант формы вмятины: circle/oval для type=circle, strip/scratch для type=strip.
 * Сохраняет позицию, clamp размеров > 1.
 */
/**
 * Convert selected dent between circle (Ellipse) and strip (Rect) while preserving bbox.
 * Used for auto-shape classification when user changes dimensions.
 */
export function convertSelectedDentToType(targetType) {
  const node = getActiveNode();
  if (!node || !node._dentMeta || !useMmMode || pxPerMm == null) return;
  const meta = node._dentMeta;
  if (meta.type === 'freeform') return;
  const currentType = meta.type;
  if (currentType === targetType) return;

  const rect = getShapeRectLocal(node);
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const id = meta.id;
  const sizes = meta.sizes;

  let shape;
  if (targetType === 'strip') {
    const w = Math.max(MIN_TRANSFORM_SIZE_PX, rect.width);
    const h = Math.max(MIN_TRANSFORM_SIZE_PX, rect.height);
    shape = new Konva.Rect({
      x: cx,
      y: cy,
      width: w,
      height: h,
      offsetX: w / 2,
      offsetY: h / 2,
      cornerRadius: 5,
      fill: 'rgba(200, 200, 200, 0.3)',
      stroke: '#A0AEC0',
      strokeWidth: 1,
      draggable: true,
      listening: true,
      name: 'dent',
      id: String(id)
    });
    shape.setAttr('type', 'strip');
  } else {
    const rx = Math.max(MIN_TRANSFORM_SIZE_PX / 2, rect.width / 2);
    const ry = Math.max(MIN_TRANSFORM_SIZE_PX / 2, rect.height / 2);
    shape = new Konva.Ellipse({
      x: cx,
      y: cy,
      radiusX: rx,
      radiusY: ry,
      offsetX: rx,
      offsetY: ry,
      fill: 'rgba(136, 229, 35, 0.3)',
      stroke: '#88E523',
      strokeWidth: 1,
      draggable: true,
      listening: true,
      name: 'dent',
      id: String(id)
    });
    shape.setAttr('type', 'circle');
  }

  const wMm = rect.width / pxPerMm;
  const hMm = rect.height / pxPerMm;
  const shapeVariant = inferShapeVariant(targetType, wMm, hMm);
  const nextMeta = {
    ...meta,
    type: targetType,
    baseType: targetType,
    shapeVariant,
    shapeKind: targetType === 'circle' ? 'oval' : 'stripe'
  };
  shape._dentMeta = nextMeta;

  if (node._dimLabel) {
    node._dimLabel.destroy();
    node._dimLabel = null;
  }
  node.destroy();
  setupDentInteractions(shape, targetType, id, sizes);
  selectNode(shape);
  if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(getSelectedDentSizeMm());
  const layer = layerDents?.getLayer ? layerDents.getLayer() : layerDents;
  if (layer) layer.batchDraw();
}

export function setDentShapeVariant(variant) {
  const node = getActiveNode();
  if (!node || !node._dentMeta || !useMmMode || pxPerMm == null || pxPerMm <= 0) return;
  const meta = node._dentMeta;
  const type = meta.type;
  if (type === 'freeform') return;
  const r = getShapeRectLocal(node);
  const minPx = Math.max(2, SIZE_MM_MIN * pxPerMm);
  const cx = node.x();
  const cy = node.y();

  if (type === 'circle') {
    const rx = Math.max(minPx / 2, r.width / 2);
    const ry = Math.max(minPx / 2, r.height / 2);
    if (variant === 'circle') {
      const r0 = Math.min(rx, ry);
      node.radiusX(r0);
      node.radiusY(r0);
      node.offsetX(r0);
      node.offsetY(r0);
    } else {
      const rx2 = Math.max(minPx / 2, rx);
      const ry2 = Math.max(minPx / 2, ry);
      node.radiusX(rx2);
      node.radiusY(ry2);
      node.offsetX(rx2);
      node.offsetY(ry2);
    }
  } else {
    let w = Math.max(minPx, r.width);
    let h = Math.max(minPx, r.height);
    if (variant === 'strip' && h > w) {
      [w, h] = [h, w];
    } else if (variant === 'scratch' && w > h) {
      [w, h] = [h, w];
    }
    node.width(w);
    node.height(h);
    node.scaleX(1);
    node.scaleY(1);
    node.offsetX(w / 2);
    node.offsetY(h / 2);
  }

  meta.shapeVariant = variant;
  if (useMmMode && imageNode) applyBounds(node);
  updateShapeCalc(node, meta.type, meta.id, meta.sizes);
  updateStroke(node);
  updateHitArea(node);
  if (useMmMode && handleGroup) positionHandle(node);
  const layer = node.getLayer();
  if (layer) layer.batchDraw();
  if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(getSelectedDentSizeMm());
}

function buildFreeformLine(meta, rect) {
  const w = rect.width || 1;
  const h = rect.height || 1;
  let pts = Array.isArray(meta.freeformPoints) && meta.freeformPoints.length > 3
    ? meta.freeformPoints
    : [0, 0, w, 0, w, h, 0, h];
  const maxVal = Math.max(...pts.map((v) => Math.abs(v)));
  if (maxVal <= 1.01) {
    const scaled = [];
    for (let i = 0; i < pts.length; i += 2) {
      scaled.push((pts[i] || 0) * w, (pts[i + 1] || 0) * h);
    }
    pts = scaled;
  }
  const line = new Konva.Line({
    points: [...pts],
    closed: true,
    fill: 'rgba(136, 229, 35, 0.2)',
    stroke: '#88E523',
    strokeWidth: 1.2,
    lineCap: 'round',
    lineJoin: 'round',
    name: 'dent',
    listening: true,
    draggable: true
  });
  line.position({ x: rect.x, y: rect.y });
  line.setAttr('type', meta.baseType || meta.type);
  return line;
}

export function setSelectedDentFreeformEnabled(enabled) {
  const node = getActiveNode();
  if (!node || !node._dentMeta) return;
  const meta = node._dentMeta;
  if (enabled && meta.freeformEnabled) return;
  if (!enabled && !meta.freeformEnabled) return;

  const baseType = meta.baseType || meta.type;
  const rect = node.getClientRect({ relativeTo: node.getParent() });
  const id = meta.id;
  const sizes = meta.sizes;

  if (enabled) {
    const nextMeta = {
      ...meta,
      type: baseType,
      baseType,
      freeformEnabled: true,
      shapeKind: baseType === 'circle' ? 'freeform-oval' : 'freeform-stripe',
      freeformPoints: Array.isArray(meta.freeformPoints) && meta.freeformPoints.length > 3
        ? meta.freeformPoints
        : [0, 0, rect.width || 1, 0, rect.width || 1, rect.height || 1, 0, rect.height || 1]
    };
    const line = buildFreeformLine(nextMeta, rect);
    line._dentMeta = nextMeta;
    if (node._dimLabel) {
      node._dimLabel.destroy();
      node._dimLabel = null;
    }
    node.destroy();
    setupDentInteractions(line, baseType, id, sizes);
    if (freeformEditMode) updateFreeformEditHandles(line);
    if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(getSelectedDentSizeMm());
    return;
  }

  const isCircle = baseType === 'circle';
  const w = rect.width || 10;
  const h = rect.height || 10;
  let shape;
  if (isCircle) {
    const rx = Math.max(2, w / 2);
    const ry = Math.max(2, h / 2);
    shape = new Konva.Ellipse({
      x: rect.x + w / 2,
      y: rect.y + h / 2,
      radiusX: rx,
      radiusY: ry,
      offsetX: rx,
      offsetY: ry,
      fill: 'rgba(136, 229, 35, 0.3)',
      stroke: '#88E523',
      strokeWidth: 1,
      draggable: true,
      listening: true,
      name: 'dent',
      id: String(id)
    });
    shape.setAttr('type', 'circle');
  } else {
    shape = new Konva.Rect({
      x: rect.x + w / 2,
      y: rect.y + h / 2,
      width: w,
      height: h,
      offsetX: w / 2,
      offsetY: h / 2,
      cornerRadius: 5,
      fill: 'rgba(200, 200, 200, 0.3)',
      stroke: '#A0AEC0',
      strokeWidth: 1,
      draggable: true,
      listening: true,
      name: 'dent',
      id: String(id)
    });
    shape.setAttr('type', 'strip');
  }
  const nextMeta = {
    ...meta,
    type: baseType,
    baseType,
    freeformEnabled: false,
    shapeKind: baseType === 'circle' ? 'oval' : 'stripe',
    freeformPoints: null
  };
  shape._dentMeta = nextMeta;
  if (node._dimLabel) {
    node._dimLabel.destroy();
    node._dimLabel = null;
  }
  node.destroy();
  setupDentInteractions(shape, baseType, id, sizes);
  clearFreeformEditHandles();
  if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(getSelectedDentSizeMm());
}

function setupDentInteractions(shape, type, id, sizes) {
  const MIN_SCALE = 0.1;
  /** Сохраняем последнее корректное состояние (scale всегда положительный). */
  const storeLastGoodTransform = () => {
    const sx = Math.max(MIN_SCALE, Math.abs(shape.scaleX()));
    const sy = Math.max(MIN_SCALE, Math.abs(shape.scaleY()));
    const attrs = {
      x: shape.x(),
      y: shape.y(),
      scaleX: sx,
      scaleY: sy,
      rotation: shape.rotation ? shape.rotation() : 0
    };
    if (shape.className === 'Ellipse') {
      const rx = Math.abs(shape.radiusX());
      const ry = Math.abs(shape.radiusY());
      attrs.radiusX = rx;
      attrs.radiusY = ry;
      attrs.offsetX = rx;
      attrs.offsetY = ry;
    }
    shape._lastGoodTransform = attrs;
  };
  storeLastGoodTransform();

  /** Центр фигуры внутри bounds — не сбрасываем трансформ при растягивании. */
  const isCenterInsideBounds = (shapeNode, bounds) => {
    const cx = shapeNode.x();
    const cy = shapeNode.y();
    return cx >= bounds.x && cx <= bounds.x + bounds.width && cy >= bounds.y && cy <= bounds.y + bounds.height;
  };

  const updateHandler = () => {
    updateShapeCalc(shape, type, id, sizes);
    if (freeformEditMode && shape.className === 'Line') updateFreeformEditHandles(shape);
    if (useMmMode && partBounds) {
      const r = getShapeRectLocal(shape);
      if (isRectInside(r, partBounds)) storeLastGoodTransform();
      else if (isCenterInsideBounds(shape, partBounds)) storeLastGoodTransform();
    } else if (isRectInsideAllBounds(shape.getClientRect())) {
      storeLastGoodTransform();
    }
  };

  shape.on('mousedown touchstart', (e) => {
    e.cancelBubble = true;
    if (contentGroup) contentGroup.draggable(false);
  });
  shape.on('dragstart', (e) => {
    e.cancelBubble = true;
    selectNode(shape);
    if (contentGroup) contentGroup.draggable(false);
  });
  shape.on('dragmove', () => {
    if (useMmMode && imageNode) applyBounds(shape);
    if (useMmMode && handleGroup) positionHandle(shape);
    if (tr) {
      tr.nodes([shape]);
      if (tr.forceUpdate) tr.forceUpdate();
    }
    updateHandler();
    const layer = layerDents.getLayer ? layerDents.getLayer() : layerDents;
    if (layer) layer.batchDraw();
  });
  shape.on('dragend', () => {
    if (useMmMode && imageNode) applyBounds(shape);
    if (useMmMode && handleGroup) positionHandle(shape);
    updateHandler();
    const layer = layerDents.getLayer ? layerDents.getLayer() : layerDents;
    if (layer) layer.batchDraw();
  });
  shape.on('transform', updateHandler);
  shape.on('transformstart', () => {
    if (contentGroup) contentGroup.draggable(false);
  });
  shape.on('transformend', () => {
    if (useMmMode && partBounds) {
      const r = getShapeRectLocal(shape);
      let dx = 0, dy = 0;
      if (r.x < partBounds.x) dx = partBounds.x - r.x;
      else if (r.x + r.width > partBounds.x + partBounds.width) dx = partBounds.x + partBounds.width - (r.x + r.width);
      if (r.y < partBounds.y) dy = partBounds.y - r.y;
      else if (r.y + r.height > partBounds.y + partBounds.height) dy = partBounds.y + partBounds.height - (r.y + r.height);
      if (dx !== 0 || dy !== 0) shape.position({ x: shape.x() + dx, y: shape.y() + dy });
    }
    // Нормализация размеров: всегда положительные, scale сбрасывается в 1
    if (shape.className === 'Rect') {
      const newW = Math.max(MIN_TRANSFORM_SIZE_PX, Math.abs(shape.width() * shape.scaleX()));
      const newH = Math.max(MIN_TRANSFORM_SIZE_PX, Math.abs(shape.height() * shape.scaleY()));
      shape.width(newW);
      shape.height(newH);
      shape.scaleX(1);
      shape.scaleY(1);
      shape.offsetX(newW / 2);
      shape.offsetY(newH / 2);
    }
    if (shape.className === 'Ellipse') {
      let newRx = Math.abs(shape.radiusX() * shape.scaleX());
      let newRy = Math.abs(shape.radiusY() * shape.scaleY());
      if (useMmMode && pxPerMm != null && pxPerMm > 0) {
        const maxR = (SIZE_MM_MAX / 2) * pxPerMm;
        newRx = Math.min(newRx, maxR);
        newRy = Math.min(newRy, maxR);
      }
      newRx = Math.max(MIN_TRANSFORM_SIZE_PX / 2, newRx);
      newRy = Math.max(MIN_TRANSFORM_SIZE_PX / 2, newRy);
      shape.radiusX(newRx);
      shape.radiusY(newRy);
      shape.offsetX(newRx);
      shape.offsetY(newRy);
      shape.scaleX(1);
      shape.scaleY(1);
    }
    if (shape.className === 'Line') {
      const sx = Math.max(0.01, Math.abs(shape.scaleX()));
      const sy = Math.max(0.01, Math.abs(shape.scaleY()));
      if (sx !== 1 || sy !== 1) {
        const curPts = shape.points?.() || [];
        const next = [];
        for (let i = 0; i < curPts.length; i += 2) {
          next.push(curPts[i] * sx, curPts[i + 1] * sy);
        }
        shape.points(next);
        shape.scaleX(1);
        shape.scaleY(1);
        normalizeLinePointsToTopLeft(shape);
      }
    }
    if (useMmMode && imageNode) applyBounds(shape);
    updateStroke(shape);
    updateHitArea(shape);
    if (useMmMode && partBounds && shape._lastGoodTransform) {
      if (!isCenterInsideBounds(shape, partBounds)) {
        shape.setAttrs(shape._lastGoodTransform);
      } else {
        const sx = Math.max(MIN_SCALE, Math.abs(shape.scaleX()));
        const sy = Math.max(MIN_SCALE, Math.abs(shape.scaleY()));
        shape.scaleX(sx);
        shape.scaleY(sy);
        storeLastGoodTransform();
      }
    } else if (!useMmMode && !isRectInsideAllBounds(shape.getClientRect()) && shape._lastGoodTransform) {
      shape.setAttrs(shape._lastGoodTransform);
    }
    updateHandler();
    if (useMmMode && handleGroup) positionHandle(shape);
    if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(getSelectedDentSizeMm());
  });
  shape.on('click tap', (e) => {
    e.cancelBubble = true;
    if (useMmMode) activeDent = shape;
    selectNode(shape);
    if (freeformEditMode && shape.className === 'Line' && shape._dentMeta?.freeformEnabled) {
      const p = getPointerPosRelativeToLayer();
      if (p) insertPointAtPointer(shape, p);
    }
  });

  layerDents.add(shape);
  /** На этапах 1–2: форма draggable (и за вмятину, и за крестик). */
  shape.draggable(wizardStep <= 2);
  if (handleGroup) handleGroup.moveToTop();
  updateStroke(shape);
  updateHitArea(shape);
  updateDentStyle(shape);
  selectNode(shape);
  updateHandler();
  const layer = layerDents.getLayer ? layerDents.getLayer() : layerDents;
  if (layer) layer.batchDraw();
}

function getPointerPosRelativeToLayer() {
  if (!stage || !layerDents) return null;
  const pos = stage.getPointerPosition();
  if (!pos) return null;
  const transform = layerDents.getAbsoluteTransform().copy().invert();
  return transform.point(pos);
}

function startFreeformDrawingSession(targetLine, meta) {
  if (!stage || !layerDents || !targetLine || !meta) return;
  freeformSizes = meta.sizes || [];
  freeformDrawing = true;
  freeformPoints = [];
  freeformLine = null;
  clearSelection();

  if (freeformListenersBound) return;
  freeformListenersBound = true;

  const startDrawing = () => {
    if (!freeformDrawing) return;
    const p = getPointerPosRelativeToLayer();
    if (!p) return;
    freeformPoints = [p.x, p.y];
    freeformLine = new Konva.Line({
      points: [...freeformPoints],
      stroke: '#88E523',
      strokeWidth: 2,
      lineCap: 'round',
      lineJoin: 'round',
      closed: true,
      fill: 'rgba(136, 229, 35, 0.2)',
      name: 'dent',
      listening: true,
      draggable: false
    });
    layerDents.add(freeformLine);
  };

  const moveDrawing = () => {
    if (!freeformDrawing || !freeformLine) return;
    const p = getPointerPosRelativeToLayer();
    if (!p) return;
    freeformPoints.push(p.x, p.y);
    freeformLine.points(freeformPoints);
    const layer = layerDents.getLayer ? layerDents.getLayer() : layerDents;
    if (layer) layer.batchDraw();
  };

  const endDrawing = () => {
    if (!freeformDrawing) return;
    freeformDrawing = false;
    if (!freeformLine || freeformPoints.length < 6) {
      if (freeformLine) freeformLine.destroy();
      freeformLine = null;
      freeformPoints = [];
      return;
    }
    let minX = freeformPoints[0];
    let minY = freeformPoints[1];
    for (let i = 2; i < freeformPoints.length; i += 2) {
      minX = Math.min(minX, freeformPoints[i]);
      minY = Math.min(minY, freeformPoints[i + 1]);
    }
    const localPts = [];
    for (let i = 0; i < freeformPoints.length; i += 2) {
      localPts.push(freeformPoints[i] - minX, freeformPoints[i + 1] - minY);
    }
    targetLine.position({ x: minX, y: minY });
    targetLine.points(localPts);
    meta.freeformPoints = [...localPts];
    meta.freeformEnabled = true;
    meta.shapeKind = meta.baseType === 'circle' ? 'freeform-oval' : 'freeform-stripe';
    updateShapeCalc(targetLine, meta.baseType, meta.id, meta.sizes);
    updateStroke(targetLine);
    updateHitArea(targetLine);
    if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(getSelectedDentSizeMm());
    if (freeformLine) freeformLine.destroy();
    freeformLine = null;
    freeformPoints = [];
  };

  stage.once('mousedown touchstart', startDrawing);
  stage.on('mousemove touchmove', moveDrawing);
  stage.once('mouseup touchend', () => {
    stage.off('mousemove touchmove', moveDrawing);
    endDrawing();
    freeformListenersBound = false;
  });
}

export function startFreeformRedrawForSelectedDent() {
  const node = getActiveNode();
  if (!node || !node._dentMeta) return;
  if (!node._dentMeta.freeformEnabled) {
    setSelectedDentFreeformEnabled(true);
  }
  const target = getActiveNode();
  if (!target || target.className !== 'Line' || !target._dentMeta) return;
  startFreeformDrawingSession(target, target._dentMeta);
}

export function addFreeformDentFromPoints(points, sizes, photoAssetKey = null) {
  if (!stage || !layerDents || !tr) return;
  if (!Array.isArray(points) || points.length < 3) return;
  const inv = layerDents.getAbsoluteTransform().copy().invert();
  const localPointsStage = points.map((p) => inv.point({ x: p.x, y: p.y }));
  const id = Date.now();
  let minX = localPointsStage[0].x;
  let minY = localPointsStage[0].y;
  let maxX = localPointsStage[0].x;
  let maxY = localPointsStage[0].y;
  localPointsStage.forEach((p) => {
    if (!p) return;
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });
  const localPoints = [];
  localPointsStage.forEach((p) => {
    localPoints.push((p.x || 0) - minX, (p.y || 0) - minY);
  });
  const bboxWidth = Math.max(1, maxX - minX);
  const bboxHeight = Math.max(1, maxY - minY);
  let centerStage = { x: stage.width() / 2, y: stage.height() / 2 };
  if (imageNode) {
    const rect = imageNode.getClientRect({ relativeTo: stage });
    centerStage = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  } else if (gridRectRef && contentGroup) {
    const s = contentGroup.scaleX();
    const pos = contentGroup.position();
    centerStage = {
      x: pos.x + (gridRectRef.x + gridRectRef.width / 2) * s,
      y: pos.y + (gridRectRef.y + gridRectRef.height / 2) * s
    };
  }
  const centerLayer = inv.point(centerStage);
  const line = new Konva.Line({
    points: localPoints,
    closed: true,
    fill: 'rgba(136, 229, 35, 0.2)',
    stroke: '#88E523',
    strokeWidth: 1.2,
    lineCap: 'round',
    lineJoin: 'round',
    name: 'dent',
    listening: true,
    draggable: true
  });
  line.position({
    x: centerLayer.x - bboxWidth / 2,
    y: centerLayer.y - bboxHeight / 2
  });
  line.setAttr('type', 'freeform');
  line._dentMeta = {
    id,
    type: 'freeform',
    baseType: 'circle',
    sizes,
    shapeVariant: 'freeform',
    shapeKind: 'freeform',
    freeformEnabled: true,
    freeformPoints: [...localPoints],
    isFreeStretchEnabled: false,
    isShapeFixed: false,
    fixedAspectRatio: null,
    photoAssetKey: photoAssetKey || null
  };
  setupDentInteractions(line, 'strip', id, sizes);
}

export function setSelectedDentShapeFixed() {
  const node = getActiveNode();
  if (!node || !node._dentMeta) return;
  if (node._dentMeta.type !== 'freeform') return;
  const rect = getShapeRectLocal(node);
  const ratio = rect?.height ? rect.width / rect.height : null;
  node._dentMeta.isShapeFixed = true;
  node._dentMeta.fixedAspectRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : null;
  node._dentMeta.isFreeStretchEnabled = false;
  selectNode(node);
  updateShapeCalc(node, node._dentMeta.baseType || node._dentMeta.type, node._dentMeta.id, node._dentMeta.sizes);
  if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(getSelectedDentSizeMm());
}

export function addDent(type, sizeCode, sizes) {
  if (!stage || !layerDents || !tr) return;

  const sizeObj = sizes.find((s) => s.code === sizeCode);
  if (!sizeObj) return;

  const id = Date.now();
  let centerX, centerY;
  if (useMmMode && partBounds) {
    centerX = partBounds.x + partBounds.width / 2;
    centerY = partBounds.y + partBounds.height / 2;
  } else if (partBounds) {
    centerX = partBounds.x + partBounds.width / 2;
    centerY = partBounds.y + partBounds.height / 2;
  } else {
    centerX = stage.width() / 2;
    centerY = stage.height() / 2;
  }

  let shape;

  if (type === 'circle') {
    let radiusX, radiusY;
    if (useMmMode && pxPerMm != null && sizeObj.mm) {
      radiusX = (sizeObj.mm.w / 2) * pxPerMm;
      radiusY = (sizeObj.mm.h / 2) * pxPerMm;
    } else {
      const r = sizeObj.radius ?? 20;
      radiusX = r;
      radiusY = r;
    }
    const rx = radiusX || 15;
    const ry = radiusY || 15;
    shape = new Konva.Ellipse({
      x: centerX,
      y: centerY,
      radiusX: rx,
      radiusY: ry,
      offsetX: rx,
      offsetY: ry,
      fill: 'rgba(136, 229, 35, 0.3)',
      stroke: '#88E523',
      strokeWidth: 1,
      draggable: true,
      listening: true,
      name: 'dent',
      id: String(id)
    });
    shape.setAttr('type', 'circle');
  } else {
    let w, h;
    if (useMmMode && pxPerMm != null && sizeObj.mm) {
      w = (sizeObj.mm.w || sizeObj.w) * pxPerMm;
      h = (sizeObj.mm.h || sizeObj.h) * pxPerMm;
    } else {
      w = sizeObj.w ?? 40;
      h = sizeObj.h ?? 20;
    }
    shape = new Konva.Rect({
      x: centerX,
      y: centerY,
      width: w,
      height: h,
      offsetX: w / 2,
      offsetY: h / 2,
      cornerRadius: 5,
      fill: 'rgba(200, 200, 200, 0.3)',
      stroke: '#A0AEC0',
      strokeWidth: 1,
      draggable: true,
      listening: true,
      name: 'dent',
      id: String(id)
    });
    shape.setAttr('type', 'strip');
  }

  const wMm = type === 'circle' ? (shape.radiusX?.() ?? 0) * 2 / (pxPerMm || 1) : (shape.width?.() ?? 0) / (pxPerMm || 1);
  const hMm = type === 'circle' ? (shape.radiusY?.() ?? 0) * 2 / (pxPerMm || 1) : (shape.height?.() ?? 0) / (pxPerMm || 1);
  const shapeVariant = inferShapeVariant(type, wMm, hMm);
  shape._dentMeta = {
    id,
    type,
    baseType: type,
    sizes,
    shapeVariant,
    shapeKind: type === 'circle' ? 'oval' : 'stripe',
    freeformEnabled: false,
    freeformPoints: null,
    isFreeStretchEnabled: false,
    isShapeFixed: false,
    fixedAspectRatio: null
  };

  if (useMmMode && partBounds) {
    const r = getShapeRectLocal(shape);
    let dx = 0, dy = 0;
    if (r.x < partBounds.x) dx = partBounds.x - r.x;
    else if (r.x + r.width > partBounds.x + partBounds.width) dx = partBounds.x + partBounds.width - (r.x + r.width);
    if (r.y < partBounds.y) dy = partBounds.y - r.y;
    else if (r.y + r.height > partBounds.y + partBounds.height) dy = partBounds.y + partBounds.height - (r.y + r.height);
    if (dx !== 0 || dy !== 0) shape.position({ x: shape.x() + dx, y: shape.y() + dy });
  }

  /** A) В mm-режиме ограничение через applyBounds на dragmove/dragend; dragBoundFunc не используем, чтобы избежать инверсии. */
  shape.dragBoundFunc((pos) => {
    if (useMmMode) return pos;
    const currentPos = shape.position();
    const currentRect = shape.getClientRect();
    const dx = pos.x - currentPos.x;
    const dy = pos.y - currentPos.y;
    const nextRect = {
      x: currentRect.x + dx,
      y: currentRect.y + dy,
      width: currentRect.width,
      height: currentRect.height
    };
    if (isRectInsideAllBounds(nextRect)) return pos;
    return currentPos;
  });

  setupDentInteractions(shape, type, id, sizes);

  // if (import.meta.env?.DEV) console.debug('[Konva] dent added at', centerX, centerY, 'partBounds', partBounds);
}

export function deleteSelected() {
  const node = getActiveNode();
  if (!node || !node._dentMeta) return;
  dentsMap.delete(node._dentMeta.id);
  tr.nodes([]);
  if (useMmMode) {
    activeDent = null;
    if (handleGroup) handleGroup.visible(false);
  }
  clearFreeformEditHandles();
  if (node._dimLabel) {
    node._dimLabel.destroy();
    node._dimLabel = null;
  }
  node.destroy();
  const layer = layerDents ? layerDents.getLayer() : null;
  if (layer) layer.batchDraw();
  if (onDentChangeCallback) onDentChangeCallback(Array.from(dentsMap.values()));
  if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(null);
}

export function resetDents() {
  if (layerDents) {
    layerDents.destroyChildren();
    dentsMap.clear();
    freeformDrawing = false;
    freeformSizes = null;
    freeformLine = null;
    freeformPoints = [];
    freeformListenersBound = false;
    freeformEditGroup = null;
    freeformEditTarget = null;
    if (stage && layerDents) {
      tr = new Konva.Transformer({
        anchorStroke: '#88E523',
        anchorFill: '#0B121E',
        anchorSize: 15,
        borderStroke: '#88E523',
        borderDash: [4, 4],
        centeredScaling: true,
        rotateEnabled: true,
        keepRatio: transformerKeepRatio,
        /** Запрет инверсии (отрицательного scale) и минимальный размер при ресайзе. */
        boundBoxFunc: (oldBox, newBox) => {
          if (newBox.width < MIN_TRANSFORM_SIZE_PX || newBox.height < MIN_TRANSFORM_SIZE_PX) return oldBox;
          if (newBox.width < 0 || newBox.height < 0) return oldBox;
          return newBox;
        }
      });
      tr.on('mousedown touchstart', () => {
        if (contentGroup) contentGroup.draggable(false);
      });
      layerDents.add(tr);
      if (useMmMode) {
        handleGroup = null;
        createHandleGroup();
        if (handleGroup) layerDents.add(handleGroup);
      }
      const layer = layerDents.getLayer ? layerDents.getLayer() : layerDents;
      if (layer) layer.batchDraw();
    }
    if (onDentChangeCallback) onDentChangeCallback([]);
    if (onSelectedDentChangeCallback) onSelectedDentChangeCallback(null);
  }
}

/**
 * Экспортировать матрицу (только contentGroup) как PNG Blob в высоком разрешении.
 * Для сохранения в вложения истории и отображения в лайтбоксе на полный экран.
 * @returns {Promise<Blob|null>}
 */
export function exportStageAsBlob() {
  if (!stage) return Promise.resolve(null);
  try {
    // Экспортируем только contentGroup (матрица без лишних отступов stage)
    const targetNode = contentGroup && contentWidth > 0 && contentHeight > 0 ? contentGroup : stage;
    const pixelRatio = targetNode === contentGroup ? 3 : 1; // Высокое разрешение для матрицы
    const dataURL = targetNode.toDataURL({ mimeType: 'image/png', pixelRatio });
    if (!dataURL || typeof dataURL !== 'string') return Promise.resolve(null);
    const arr = dataURL.split(',');
    const mime = (arr[0].match(/:(.*?);/) || [])[1] || 'image/png';
    const bstr = atob(arr[1] || '');
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return Promise.resolve(new Blob([u8arr], { type: mime }));
  } catch {
    return Promise.resolve(null);
  }
}

export function getDents() {
  return Array.from(dentsMap.values());
}

export function destroyKonva() {
  if (resizeObserverRef && resizeObservedEl) {
    resizeObserverRef.unobserve(resizeObservedEl);
    resizeObserverRef = null;
    resizeObservedEl = null;
  }
  if (windowResizeHandler) {
    window.removeEventListener('resize', windowResizeHandler);
    windowResizeHandler = null;
  }
  if (stage) {
    stage.destroy();
    stage = null;
  }
  containerRef = null;
  baseScale = 1;
  basePos = { x: 0, y: 0 };
  fitPending = false;
  lastFitW = 0;
  lastFitH = 0;
  layerParts = null;
  layerGrid = null;
  layerDents = null;
  tr = null;
  selectedPart = null;
  prices = {};
  onDentChangeCallback = null;
  onSelectedDentChangeCallback = null;
  dentsMap.clear();
  partBounds = null;
  stageBounds = null;
  pxPerMm = null;
  imageRect = null;
  imageNode = null;
  gridRectRef = null;
  useMmMode = false;
  baseUrl = '';
  contentGroup = null;
  contentWidth = 0;
  contentHeight = 0;
  heatZonesPx = [];
  bgRect = null;
  clearPhotoBackground();
  layerPhoto = null;
  photoImageNode = null;
  handleGroup = null;
  activeDent = null;
  transformerKeepRatio = true;
  hideGridOnMobile = false;
  freeformDrawing = false;
  freeformSizes = null;
  freeformLine = null;
  freeformPoints = [];
  freeformListenersBound = false;
  freeformEditMode = false;
  freeformEditGroup = null;
  freeformEditTarget = null;
}
