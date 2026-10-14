// Minimal types for the parts of opentype.js used by generate-brand-assets.ts.
declare module 'opentype.js' {
  export interface Path {
    commands: unknown[];
    toPathData(options?: { decimalPlaces?: number; flipY?: boolean }): string;
    getBoundingBox(): { x1: number; y1: number; x2: number; y2: number };
  }
  export interface Glyph {
    advanceWidth?: number;
    getPath(x: number, y: number, fontSize: number): Path;
  }
  export interface Font {
    unitsPerEm: number;
    charToGlyph(char: string): Glyph;
    getKerningValue(left: Glyph, right: Glyph): number;
  }
  export function parse(buffer: ArrayBuffer | SharedArrayBuffer): Font;
  const opentype: { parse: typeof parse };
  export default opentype;
}
