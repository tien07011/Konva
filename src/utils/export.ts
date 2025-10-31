import type { AnyShape } from '../types/drawing';
import type { Screen as OutScreen, Shape as OutShape } from '../types/interface';

export interface ExportOptions {
  id?: string;
  name?: string;
  background?: string;
}

export function buildScreenFromShapes(shapes: AnyShape[], opts: ExportOptions = {}): OutScreen {
  const { id = 'screen_1', name = 'Canvas', background = '#ffffff' } = opts;

  const outShapes: OutShape[] = shapes.map((s) => {
    if (s.type === 'line') {
      const d = `M ${s.points[0]} ${s.points[1]} L ${s.points[2]} ${s.points[3]}`;
      return {
        id: s.id,
        d,
        stroke: s.stroke,
        strokeWidth: s.strokeWidth,
      };
    }
    return {
      id: s.id,
      d: '',
    };
  });

  const screen: OutScreen = {
    id,
    name,
    shapes: outShapes,
    groups: [],
    background,
  };

  return screen;
}
