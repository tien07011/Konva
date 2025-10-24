import React from 'react';
import { Image as KImage, Transformer } from 'react-konva';
import Konva from 'konva';
import { EditableShapeProps, SvgShape, ShapeModule, DrawContext } from './types';

function ensureRawSvg(svg: string): string | null {
  const s = (svg || '').trim();
  if (!s) return null;
  if (s.startsWith('<')) return s;
  if (s.startsWith('data:image/svg+xml')) {
    const comma = s.indexOf(',');
    if (comma === -1) return null;
    const meta = s.substring(0, comma);
    const data = s.substring(comma + 1);
    if (/;base64/i.test(meta)) {
      try { return atob(data); } catch { return null; }
    }
    try { return decodeURIComponent(data); } catch { return null; }
  }
  // For external URLs we can't fetch here; return null to skip colorizing
  return null;
}

function applyColorOverrides(svg: string, fill: string, stroke: string, strokeWidth: number): string {
  const raw = ensureRawSvg(svg);
  if (!raw) return svg; // fallback: unable to parse, return original
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'image/svg+xml');
    const root = doc.documentElement;
    const skipTags = new Set(['defs', 'linearGradient', 'radialGradient', 'clipPath', 'mask', 'pattern', 'style', 'filter', 'metadata']);
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    // also set defaults on root so children without explicit styles inherit
    if (fill) root.setAttribute('fill', fill);
    if (stroke) root.setAttribute('stroke', stroke);
    if (Number.isFinite(strokeWidth) && strokeWidth >= 0) root.setAttribute('stroke-width', String(strokeWidth));
    let node = walker.nextNode() as Element | null;
    while (node) {
      const tag = node.tagName;
      if (!skipTags.has(tag)) {
        // If element uses gradient/pattern, don't override
        const f = node.getAttribute('fill');
        const s = node.getAttribute('stroke');
        const styleStr = node.getAttribute('style') || '';
        const hasUrlFill = (f && /^url\(/i.test(f)) || /fill\s*:\s*url\(/i.test(styleStr);
        const hasUrlStroke = (s && /^url\(/i.test(s)) || /stroke\s*:\s*url\(/i.test(styleStr);
        const hasNoneFill = (f && f.trim() === 'none') || /fill\s*:\s*none/i.test(styleStr);
        const hasNoneStroke = (s && s.trim() === 'none') || /stroke\s*:\s*none/i.test(styleStr);

        // Overwrite style attribute to remove old fill/stroke to avoid precedence issues
        if (styleStr) {
          const cleaned = styleStr
            .replace(/fill\s*:\s*[^;]+;?/gi, '')
            .replace(/stroke\s*:\s*[^;]+;?/gi, '')
            .replace(/stroke-width\s*:\s*[^;]+;?/gi, '')
            .trim();
          if (cleaned) node.setAttribute('style', cleaned);
          else node.removeAttribute('style');
        }

        if (!hasUrlFill && !hasNoneFill && fill) node.setAttribute('fill', fill);
        else if (hasNoneFill) node.setAttribute('fill', 'none');

        if (!hasUrlStroke && !hasNoneStroke && stroke) node.setAttribute('stroke', stroke);
        else if (hasNoneStroke) node.setAttribute('stroke', 'none');

        if (Number.isFinite(strokeWidth) && strokeWidth >= 0 && !hasNoneStroke) node.setAttribute('stroke-width', String(strokeWidth));
      }
      node = walker.nextNode() as Element | null;
    }
    const ser = new XMLSerializer();
    return ser.serializeToString(doc);
  } catch {
    return svg; // fallback on any error
  }
}

function svgToDataUrl(svg: string): string {
  const cleaned = svg.trim();
  const prefix = 'data:image/svg+xml;charset=utf-8,';
  // Avoid double-encoding if already a data URL
  if (cleaned.startsWith('data:image/svg+xml')) return cleaned;
  return prefix + encodeURIComponent(cleaned);
}

const SvgShapeComponent: React.FC<EditableShapeProps<SvgShape>> = ({ shape, isSelected, onSelect, onChange }) => {
  const shapeRef = React.useRef<Konva.Image>(null);
  const trRef = React.useRef<Konva.Transformer>(null);
  const [imageObj, setImageObj] = React.useState<HTMLImageElement | null>(null);

  // Load/reload image when SVG string changes
  React.useEffect(() => {
    if (!shape.svg) { setImageObj(null); return; }
    const img = new window.Image();
    // crossOrigin allows drawing to canvas and exporting without taint when URL-based
    img.crossOrigin = 'anonymous';
    img.onload = () => setImageObj(img);
    img.onerror = () => setImageObj(null);
    const recolored = applyColorOverrides(shape.svg, shape.fill, shape.stroke, shape.strokeWidth);
    img.src = svgToDataUrl(recolored);
    return () => {
      // No special cleanup needed; let GC handle HTMLImageElement
    };
  }, [shape.svg, shape.fill, shape.stroke, shape.strokeWidth]);

  React.useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KImage
        ref={shapeRef}
        image={imageObj || undefined}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        rotation={shape.rotation || 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e: any) => {
          onChange({ x: e.target.x(), y: e.target.y() });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current!;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={[
            'top-left',
            'top-center',
            'top-right',
            'middle-left',
            'middle-right',
            'bottom-left',
            'bottom-center',
            'bottom-right',
          ]}
        />
      )}
    </>
  );
};

export default SvgShapeComponent;

export const SvgModule: ShapeModule<SvgShape> = {
  type: 'svg',
  label: 'SVG',
  Component: SvgShapeComponent,
  create: (id, x, y, base) => ({
    id,
    type: 'svg',
    x,
    y,
    width: 120,
    height: 120,
    rotation: 0,
    // default simple placeholder SVG
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" rx="8" ry="8" fill="#e5e7eb" stroke="#94a3b8" stroke-width="4"/><text x="50" y="54" font-size="12" text-anchor="middle" fill="#334155">SVG</text></svg>',
    fill: base.fill,
    stroke: base.stroke,
    strokeWidth: base.strokeWidth,
  }),
  updateOnDraw: (shape: SvgShape, ctx: DrawContext) => {
    const dx = ctx.current.x - ctx.start.x;
    const dy = ctx.current.y - ctx.start.y;
    const nx = Math.min(ctx.start.x, ctx.current.x);
    const ny = Math.min(ctx.start.y, ctx.current.y);
    return { x: nx, y: ny, width: Math.abs(dx), height: Math.abs(dy) };
  },
  isValidAfterDraw: (s) => s.width >= 3 && s.height >= 3 && !!s.svg,
  normalize: (raw, base) => {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id ?? 'svg-' + Date.now());
    const x = Number(raw.x) || 0;
    const y = Number(raw.y) || 0;
    const rotation = Number(raw.rotation) || 0;
    const width = Number(raw.width) || 0;
    const height = Number(raw.height) || 0;
    let svg = '';
    if (typeof raw.svg === 'string') svg = raw.svg;
    else if (typeof raw.src === 'string') {
      // If 'src' is a full SVG string, use it. If it's a data URL or URL, keep as-is in svg field for consistency.
      svg = raw.src;
    }
    if (!svg || width <= 0 || height <= 0) return null;
    return {
      id,
      type: 'svg',
      x,
      y,
      rotation,
      width,
      height,
      svg,
      fill: typeof raw.fill === 'string' ? raw.fill : base.fill,
      stroke: typeof raw.stroke === 'string' ? raw.stroke : base.stroke,
      strokeWidth: Number(raw.strokeWidth) || base.strokeWidth,
    };
  },
};
