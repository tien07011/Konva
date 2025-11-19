import type { AnyShape } from '../types/drawing';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Check if a shape intersects with the selection rectangle
 */
export function isShapeInSelection(shape: AnyShape, selectionRect: SelectionRect): boolean {
  const { x, y, width, height } = selectionRect;
  const left = x;
  const right = x + width;
  const top = y;
  const bottom = y + height;

  if (shape.type === 'rect') {
    const shapeLeft = shape.x;
    const shapeRight = shape.x + shape.width;
    const shapeTop = shape.y;
    const shapeBottom = shape.y + shape.height;
    
    return !(shapeRight < left || shapeLeft > right || shapeBottom < top || shapeTop > bottom);
  }

  if (shape.type === 'text') {
    const shapeLeft = shape.x;
    const shapeTop = shape.y;
    const shapeRight = shape.x + (shape.width ?? 0);
    const shapeBottom = shape.y + (shape.height ?? 0);
    return !(shapeRight < left || shapeLeft > right || shapeBottom < top || shapeTop > bottom);
  }

  if (shape.type === 'circle') {
    const { cx, cy, r } = shape;
    // Check if circle center is in rectangle or if circle intersects with rectangle
    const closestX = Math.max(left, Math.min(cx, right));
    const closestY = Math.max(top, Math.min(cy, bottom));
    const distanceX = cx - closestX;
    const distanceY = cy - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;
    
    return distanceSquared <= r * r;
  }

  if (shape.type === 'line' || shape.type === 'freehand' || shape.type === 'qcurve' || shape.type === 'ccurve') {
    const points = shape.points;
    // Check if any point is inside the selection rectangle
    for (let i = 0; i < points.length; i += 2) {
      const px = points[i];
      const py = points[i + 1];
      if (px >= left && px <= right && py >= top && py <= bottom) {
        return true;
      }
    }
    return false;
  }

  return false;
}
