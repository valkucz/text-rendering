import { mat4, vec2, vec4 } from "gl-matrix";
import { Glyph } from "./glyph";
import { FontParser } from "../../fonts/fontParser";
import { VertexBuffer } from "./vertexBuffer";

const defaultColor = [0.0, 0.0, 0.0, 1.0];
const defaultBgColor = [1.0, 1.0, 1.0, 0.0];
const MAT4LENGTH = 64;
const VEC4LENGTH = 16;
export class TextBlock {
  device: GPUDevice;
  private _size: number;
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
    this.device = device;
    this._text = text;
    this.fontParser = fontParser;
    this._color = color ?? defaultColor;
    this._bgColor = backgroundColor ?? defaultBgColor;
    this._colorBuffer = this.createVertexBuffer(device, this.getColorArray());

    this._size = 0;
    this._glyphs = this.createGlyphs();
  }

  public get size(): number {
    return this._size;
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
    const alignment = this.device.limits.minStorageBufferOffsetAlignment;
    const glyphs = [];
    let offset = 0;
    for (let i = 0; i < this._text.length; i++) {
      let vertices = this.fontParser.parseText(this._text[i]);
      let size = Math.ceil ((vertices.length + 16 + 4 + 1) / alignment) * alignment;
  
      glyphs.push({
        vertices: vertices,
        model: this.setModel(i),
        bb: this.getBoundingBox(vertices),
        length: vertices.length / 2,
        size: size,
        offset: offset,
      });
      offset += size;
    }
    
    // offset = Math.ceil(offset / alignment) * alignment;156*4
    this._size = offset;
    return glyphs;
  }

    // Buffer

    getBuffer() {
      // vertices, model, bb

      const buffer = new Float32Array(this._size);
      
      let offset = 0;

      console.log(this._size);
      console.log(this._glyphs);
      const alignment = this.device.limits.minStorageBufferOffsetAlignment;
      for (let i = 0; i < this._glyphs.length; i++) {
        const glyph = this._glyphs[i];
        offset = glyph.offset;
        const vertices = glyph.vertices;
        const model = glyph.model;
        const bb = glyph.bb;

        buffer.set([glyph.length], offset);
        offset += 4;

        buffer.set(model, offset);

        // const modelView = new Float32Array(buffer, offset, 16);
        // modelView.set(model);
        offset += 16;

        // const bbView = new Float32Array(buffer, offset, 4);
        // bbView.set(bb);
        buffer.set(bb, offset);
        offset += 4;

        // const lengthView = new Float32Array(buffer, offset, 1);
        // lengthView.set([glyph.length]);
        console.log(vertices.length / 2, glyph.length);

        console.log(vertices.byteLength)

        // const verticesView = new Float32Array(buffer, offset);
        // verticesView.set(vertices);

        buffer.set(vertices, offset);
        offset += vertices.length;
        console.log('last offset glyph', offset);
        // offset += 
      }
      return buffer;

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
