import { mat4, vec2, vec4 } from "gl-matrix";
import { Glyph } from "./glyph";
import { FontParser } from "../../fonts/fontParser";
import { VertexBuffer } from "./vertexBuffer";

const defaultColor = [0.0, 0.0, 0.0, 1.0];
const defaultBgColor = [1.0, 1.0, 1.0, 0.0];

export class TextBlock {
  private _text: string;
  private _color: number[];
  private _bgColor: number[];
  private _glyphs: Glyph[];
  private _colorBuffer: VertexBuffer;
  fontParser: FontParser;

  constructor(
    device: GPUDevice,
    text: string,
    fontParser: FontParser,
    color?: number[],
    backgroundColor?: number[]
  ) {
    this._text = text;
    this.fontParser = fontParser;
    this._color = color ?? defaultColor;
    this._bgColor = backgroundColor ?? defaultBgColor;
    this._colorBuffer = this.createVertexBuffer(device, this.getColorArray());

    this._glyphs = this.createGlyphs();
  }

  public get text(): string {
    return this._text;
  }

  public get color(): number[] {
    return this._color;
  }

  // TODO: remove bg color
  public get bgColor(): number[] {
    return this._bgColor;
  }

  public get glyphs(): Glyph[] {
    return this._glyphs;
  }

  public get colorBuffer(): VertexBuffer {
    return this._colorBuffer;
  }
  private getColorArray(): Float32Array {
    return new Float32Array(this._color.concat(this._bgColor));
  }
  private createVertexBuffer(
    device: GPUDevice,
    vertices: Float32Array
  ): VertexBuffer {
    return new VertexBuffer(device, vertices);
  }
  private createGlyphs(): Glyph[] {
    const glyphs = [];
    for (let i = 0; i < this._text.length; i++) {
      let vertices = this.fontParser.parseText(this._text[i]);
      glyphs.push({
        vertices: vertices,
        model: this.setModel(i),
        bb: this.getBoundingBox(vertices),
      });
    }
    return glyphs;
  }

  private getBoundingBox(vertices: Float32Array): vec4 {
    const min = vec2.fromValues(Infinity, Infinity);
    const max = vec2.fromValues(-Infinity, -Infinity);

    for (let i = 0; i < vertices.length; i += 2) {
      const x = vertices[i];
      const y = vertices[i + 1];

      vec2.min(min, min, vec2.fromValues(x, y));
      vec2.max(max, max, vec2.fromValues(x, y));
    }

    return vec4.fromValues(min[0], min[1], max[0], max[1]);
  }

  private setModel(shift: number): mat4 {
    const model = mat4.create();
    // for default setting, use fromXRotation?
    // https://glmatrix.net/docs/module-mat4.html
    mat4.rotateY(model, model, Math.PI / 2);
    // mat4.rotateZ(this.model, this.model, -Math.PI);
    // TODO: customize translation
    mat4.scale(model, model, [0.5, 0.5, 0.5]);
    mat4.translate(model, model, [shift, 0, 0])
    return model;
  }
}
