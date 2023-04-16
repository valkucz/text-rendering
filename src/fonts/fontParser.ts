import { vec2 } from "gl-matrix";
import { cubicToQuadratic } from "../math";
import { vec2ToFloat32 } from "../math";
import opentype, { Font, PathCommand } from "opentype.js";

export interface ParsedGlyph {
  bb: opentype.BoundingBox;
  vertices: Float32Array;
}

export class FontParser {
  private _initFont: Font;
  font: Font;

  constructor(font: Font) {
    this.font = font;
    this._initFont = font;
  }

  public get height(): number {
    return this.font.ascender - this.font.descender;
  }

  static async initialize(url: string): Promise<FontParser> {
    return FontParser.loadFont(url).then((font) => new FontParser(font));
  }

  resetFont() {
    this.font = this._initFont;
  }

  static async loadFont(url: string): Promise<Font> {
    const opentypeFont = await opentype.load(url);
    return opentypeFont;
  }

  async changeFont(url: string): Promise<void> {
    console.log(url);
    this.font = await FontParser.loadFont(url);
  }

  parseText(text: string, isWinding: boolean = true): ParsedGlyph[] {
    const paths = this.font.getPaths(text, 0, 0, 5000, { kerning: true });
    const enter = new opentype.Glyph({ unicode: 10 });
    console.log("enter", enter);
    const parseGlyphs: ParsedGlyph[] = [];
    paths.forEach((path) => {
      let bb = path.getBoundingBox();
      let vertices = this.parseShapeToGlyph(path.commands, isWinding);
      // Handling space cases
      if (vertices.length == 0) {
        vertices = new Float32Array([0, 0, this.height, 0]);
        bb.x2 = this.height;
      }
      parseGlyphs.push({ bb, vertices });
    });
    return parseGlyphs;
  }

  private getMiddle(point1: vec2, point2: vec2): vec2 {
    const res = vec2.create();
    vec2.add(res, point1, point2);
    vec2.scale(res, res, 0.5);
    return res;
  }

  private parseShapeToGlyph(
    cmds: PathCommand[],
    isWinding: boolean = true
  ): Float32Array {
    let vertices: vec2[] = [];
    let last = vec2.create();
    let first = vec2.create();

    cmds.forEach((cmd) => {
      switch (cmd.type) {
        case "M":
          first = vec2.fromValues(cmd.x, cmd.y);
          last = vec2.clone(first);
          break;
        case "L":
          let curr = vec2.fromValues(cmd.x, cmd.y);
          if (!isWinding) {
            vertices.push(vec2.fromValues(-1, -1));
          }
          vertices.push(last);
          vertices.push(this.getMiddle(last, curr));
          vertices.push(curr);
          last = vec2.clone(curr);
          break;
        case "C":
          let points = [
            last,
            vec2.fromValues(cmd.x1, cmd.y1),
            vec2.fromValues(cmd.x2, cmd.y2),
            vec2.fromValues(cmd.x, cmd.y),
          ];
          cubicToQuadratic(points).forEach((qpoints) => {
            if (!isWinding) {
              vertices.push(vec2.fromValues(1, 1));
            }
            vertices = vertices.concat(qpoints);
          });
          last = vec2.clone(vertices[vertices.length - 1]);
          break;
        case "Q":
          if (!isWinding) {
            vertices.push(vec2.fromValues(1, 1));
          }
          vertices.push(last);
          vertices.push(vec2.fromValues(cmd.x1, cmd.y1));
          vertices.push(vec2.fromValues(cmd.x, cmd.y));
          last = vec2.fromValues(cmd.x, cmd.y);
          break;
        case "Z":
          if (!isWinding) {
            vertices.push(vec2.fromValues(-1, -1));
          }
          vertices.push(last);
          vertices.push(this.getMiddle(last, first));
          vertices.push(first);
          last = vec2.clone(first);
          break;
        default:
          break;
      }
    });
    return vec2ToFloat32(vertices);
  }
}
