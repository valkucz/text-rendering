import { vec2 } from "gl-matrix";
import { cubicToQuadratic } from "../approximation";
import { Typr } from "../Typr";
import Font from "./font";
import { vec2ToFloat32 } from "../math";

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
    // TODO: catch error?
    const response: Response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const tables = Typr.parse(arrayBuffer);

    return tables[0];
  }

  getBb(): number[] {
    return [
      this.font.head.xMin * 16, this.font.head.yMin * 16, 
      this.font.head.xMax * 16, this.font.head.yMax * 16];
  }

  async changeFont(url: string): Promise<void> {
    console.log(url);
    this.font = await FontParser.loadFont(url);
  }

  parseText(text: string): Float32Array {
    const shape = Typr.U.shape(this.font, text, true);
    const path = Typr.U.shapeToPath(this.font, shape);
    console.log(path.cmds, path.crds);

    // return this.debugPoints();
    return this.parseShapeToGlyph(path.cmds, path.crds);
  }


  getPosition(pos: number, crds: number[]): vec2 {
    return vec2.fromValues(crds[pos] * 16, crds[pos + 1] * 16);
  }

  getMiddle(point1: vec2, point2: vec2): vec2 {
    const res = vec2.create();

    vec2.add(res, point1, point2);
    vec2.scale(res, res, 0.5);
    return res;
  }

  // To create Float32Array directly, we need to know length beforehand
  // FIXME: no need, new Float32Array(points[]) is fine
  calculateLength(cmd: string[]): number {
    let length = 0;
    cmd.forEach((c) => {
      switch (c) {
        case "M":
          break;
        case "L":
          length += 6;
          break;
        case "C":
          length += 12;
          break;
        case "Q":
          length += 6;
          break;
        case "Z":
          length += 6;
          break;
        default:
          break;
      }
    });
    console.log("Length:", length);
    return length;
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

  parseShapeToGlyph(cmds: string[], crds: number[]): Float32Array {
    let vertices: vec2[] = [];
    let pos = 0;
    let last = vec2.create();
    let first = this.getPosition(pos, crds);
    cmds.forEach((cmd, i) => {
      switch (cmd) {
        case "M":
          first = this.getPosition(pos, crds);
          last = vec2.clone(first);

          pos += 2;
          break;
        case "L":
          let pt2 = this.getPosition(pos, crds);
          vertices = vertices.concat([
           last,
           this.getMiddle(last, pt2),
           pt2]);
          last = vec2.clone(pt2);
          pos += 2;
          break;
        case "C":
          let points = [last];
          for (let i = pos; i < pos + 6; i += 2) {
            points.push(this.getPosition(i, crds));
          }
          cubicToQuadratic(points).forEach((qpoints) => {
            vertices = vertices.concat(qpoints);
          });
          last = vec2.clone(vertices[vertices.length - 1]);
          pos += 6;
          break;
        case "Q":
          vertices = vertices.concat([
            last,
            this.getPosition(pos, crds),
            this.getPosition(pos + 2, crds)]);
            last = vec2.clone(this.getPosition(pos + 2, crds));
            pos += 4;
          break;
        case "Z":
          vertices = vertices.concat([
            last,
            this.getMiddle(last, first),
            first]);
          // if (i === cmds.length - 1) {

          // }
          // vertices = vertices.concat([
          //   last,
          //   this.getMiddle(last, curr),
          //   first]);
            // last = vec2.clone(first);
            // pos += 2;
          break;
        default:
          break;
      }
    });
    // const flatten = vertices.flat();
    return vec2ToFloat32(vertices);
    // return new Float32Array(vertices.flat());
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
    const bb = this.getBb();
    console.log(bb);
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
