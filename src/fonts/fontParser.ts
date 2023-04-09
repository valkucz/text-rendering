import { vec2, vec4 } from "gl-matrix";
import { cubicToQuadratic } from "../approximation";
import { vec2ToFloat32 } from "../math";
import opentype, { Font, PathCommand } from 'opentype.js'

export class FontParser {
  initFont: Font;
  font: Font;

  constructor(font: Font) {
    this.font = font;
    this.initFont = font;
  }

  static async initialize(url: string): Promise<FontParser> {
    console.log(url);
    return FontParser.loadFont(url).then((font) => new FontParser(font));
  }

  reset() {
    this.font = this.initFont;
  }

  static async loadFont(url: string): Promise<Font> {
    const opentypeFont = await opentype.load(url);
    return opentypeFont;
  }


  async changeFont(url: string): Promise<void> {
    console.log(url);
    this.font = await FontParser.loadFont(url);
  }

  parseText(text: string) {
    const path = this.font.getPath(text, 0, 0, 5000, { kerning: true });
    const path2 = this.font.getPath('Ap', 0, 0, 5000, { kerning: false });
    const advWidth = this.font.getAdvanceWidth('Ap', 5000);
    console.log('ADVANCE WIDTH', advWidth);
    console.log('Shape kerning', path);
    console.log('SHAPE NO KERNING', path2);
    const bb = path.getBoundingBox();
    console.log('BB', bb);

    
    // return this.debugPoints();
    return { bb, vertices: this.parseShapeToGlyph(path.commands) };
  }

  getMiddle(point1: vec2, point2: vec2): vec2 {
    const res = vec2.create();

    vec2.add(res, point1, point2);
    vec2.scale(res, res, 0.5);
    return res;
  }

  pushToArray(arr: Float32Array, index: number, points: vec2[]): void {
    points.forEach((point) => {
      arr[index] = point[0];
      arr[index + 1] = point[1];
      index += 2;
    });
  }

  middle(a: number, b: number): number {
    return (a + b) / 2;
  }

  parseShapeToGlyph(cmds: PathCommand[]): Float32Array {
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
          vertices.push(last);
          vertices.push(this.getMiddle(last, curr));
          vertices.push(curr);
          last = vec2.clone(curr);
          break;
        case "C":
          let points = [last, vec2.fromValues(cmd.x1, cmd.y1), vec2.fromValues(cmd.x2, cmd.y2), vec2.fromValues(cmd.x, cmd.y)];
          cubicToQuadratic(points).forEach((qpoints) => {
            vertices = vertices.concat(qpoints);
          });
          last = vec2.clone(vertices[vertices.length - 1]);
          break;
        case "Q":
          vertices.push(last);
          vertices.push(vec2.fromValues(cmd.x, cmd.y));
          vertices.push(vec2.fromValues(cmd.x1, cmd.y1));
          last = vec2.clone(vec2.fromValues(cmd.x1, cmd.y1));
          break;
        case "Z":
          vertices.push(last);
          vertices.push(this.getMiddle(last, first));
          vertices.push(first);
          // last = vec2.clone(first);
          break;
        default:
          break;
      }
    });
    return vec2ToFloat32(vertices);
  }

  reversePoints(points: number[]): number[] {
    const reversed = [];

    for (let i = points.length - 2; i >= 0; i -= 2) {
      reversed.push(points[i], points[i + 1]);
    }
    console.log('Reversed:', reversed);
    return reversed;
  }

  debugPoints() : Float32Array {
    const straightLine = new Float32Array([100, 0, 550, 900, 5000, 1000]);
    const line = new Float32Array([248, -1600, 944, -1600, 3584, 5936]);
    const line2 = new Float32Array([6224, 13472, 6224, 13472, 5528, 13472])


    const line3 = [-448, -1600, 248, -1600, 944, -1600];
    // const line4 = [944, -1600, 3584, 5936, 6224, 13472];
    const line4 = [944, -1600, 3584, 5936, 6224, 13472];
    const line5 = [6224, 13472, 5528, 13472, 4832, 13472];
    const line6 = [4832, 13472, 2192, 5936, -448, -1600];


    const linex = [944, -1600, 3584, 5936, 6224, 13472, 6224, 13472, 5528, 13472, 4832, 13472];
    const linexx = linex.map(val => val + 1600);
    return new Float32Array(this.reversePoints(line3.concat(line4).concat(line5).concat(line6)));
  }
}
