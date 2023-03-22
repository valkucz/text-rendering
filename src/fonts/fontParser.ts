import { vec2 } from "gl-matrix";
import { cubicToQuadratic } from "../approximation";
import { Typr } from "../Typr";
import Font from "./font";

export class FontParser {
  initFont: Font;
  font: Font;

  constructor(font: Font) {
    this.font = font;
    this.initFont = font;
  }

  static async initialize(url: string): Promise<FontParser> {
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

  async changeFont(url: string): Promise<void> {
    this.font = await FontParser.loadFont(url);
  }

  parseText(text: string): Float32Array {
    const shape = Typr.U.shape(this.font, text, true);
    const path = Typr.U.shapeToPath(this.font, shape);
    return this.parseShapeToGlyph(path.cmds, path.crds);
  }

  getPosition(pos: number, crds: number[]): vec2 {
    return vec2.fromValues(crds[pos] * 100, crds[pos + 1] * 100);
  }

  getMiddle(point1: vec2, point2: vec2): vec2 {
    const res = vec2.create();

    vec2.add(res, point1, point2);
    vec2.scale(res, res, 0.5);
    return res;
  }

  // To create Float32Array directly, we need to know length beforehand
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

  parseShapeToGlyph(cmds: string[], crds: number[]): Float32Array {
    const vertices = new Float32Array(this.calculateLength(cmds));
    let points: vec2[] = [];

    let last: vec2 = vec2.create();
    let first: vec2 = vec2.create();
    let curr: vec2 = vec2.create();

    let index = 0;
    let indexArr = 0;

    cmds.forEach((cmd) => {
      switch (cmd) {
        case "M":
          first = this.getPosition(index, crds);
          vec2.copy(last, first);
          index += 2;
          break;
        case "L":
          curr = this.getPosition(index, crds);
          this.pushToArray(vertices, indexArr, [
            last,
            this.getMiddle(last, curr),
            curr,
          ]);
          indexArr += 6;
          index += 2;
          break;
        case "C":
          for (let i = index - 2; i < index + 6; i += 2) {
            points.push(this.getPosition(i, crds));
          }
          vec2.copy(last, points[3]);
          cubicToQuadratic(points).forEach((qpoints) => {
            this.pushToArray(vertices, indexArr, qpoints);
            indexArr += 6;
          });
          points = [];
          index += 6;
          break;
        case "Q":
          for (let i = index - 2; i < index + 4; i += 2) {
            points.push(this.getPosition(i, crds));
          }
          this.pushToArray(vertices, indexArr, points);
          points = [];
          indexArr += 6;
          index += 4;
          break;
        case "Z":
          this.pushToArray(vertices, indexArr, [
            last,
            this.getMiddle(last, first),
            first,
          ]);
          indexArr += 6;
          break;
        default:
          break;
      }
    });
    console.log(vertices);
    return vertices;
  }
}
