import { mat4, vec2, vec4 } from "gl-matrix";
import { Glyph } from "./glyph";
import { FontParser } from "../../fonts/fontParser";
import { VertexBuffer } from "./vertexBuffer";

const defaultColor = [0.0, 0.0, 0.0, 1.0];
const defaultBgColor = [0.0, 1.0, 1.0, 0.0];
export class TextBlock {
  device: GPUDevice;
  private _verticesSize: number;
  private _transformsSize: number;
  private _text: string;
  color: number[];
  bgColor: number[];
  private _glyphs: Glyph[];
  private _colorBuffer: VertexBuffer;
  fontParser: FontParser;
  private _verticesBuffer: Float32Array;
  private _transformsBuffer: Float32Array;

  bb: vec4;

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
    this.color = color ?? defaultColor;
    this.bgColor = backgroundColor ?? defaultBgColor;
    this._colorBuffer = this.createVertexBuffer(device, this.getColorArray());

    this._verticesSize = 0;
    this._transformsSize = 0;
    this._glyphs = this.createGlyphs();
    this._verticesBuffer = this.createVerticesBuffer();
    this._transformsBuffer = this.createTransformsBuffer();

    this.bb = vec4.create();
  }

  public get verticesBuffer() {
    return this._verticesBuffer;
  }

  public get transformsBuffer() {
    return this._transformsBuffer;
  }

  public get verticesSize(): number {
    return this._verticesSize;
  }

  public get transformsSize(): number {
    return this._transformsSize;
  }

  public get text(): string {
    return this._text;
  }

  public get glyphs(): Glyph[] {
    return this._glyphs;
  }

  public get colorBuffer(): VertexBuffer {
    return this._colorBuffer;
  }
  private getColorArray(): Float32Array {
    return new Float32Array(this.color.concat(this.bgColor));
  }
  private createVertexBuffer(
    device: GPUDevice,
    vertices: Float32Array
  ): VertexBuffer {
    return new VertexBuffer(device, vertices);
  }
  private createGlyphs(): Glyph[] {
    console.log(this._text);
    const alignment = this.device.limits.minStorageBufferOffsetAlignment;
    const glyphs: Glyph[] = [];
    let transformsOffset = 0;
    let verticesOffset = 0;
    const bbs = [];
    const bbx = this.fontParser.parseText('x')[0].bb;

    let prevScale = 1;
    let prevWidth = 0;
    let offsetX = 0;
    this.fontParser.parseText(this._text).forEach((glyph, i) => {
      const { bb, vertices } = glyph;
      let transformsSize = Math.ceil(21 / alignment) * alignment;
      let verticesSize = Math.ceil(vertices.length / alignment) * alignment;
      bbs.push(bb);
      let {model, deltaX} = this.setModel(i, bb, glyph, offsetX, prevWidth);
      glyphs.push({
        vertices: vertices,
        model: model,
        bb: vec4.fromValues(bb.x1, bb.y1, bb.x2, bb.y2),
        length: vertices.length / 2,
        transformsSize: transformsSize,
        verticesSize: verticesSize,
        transformsOffset: transformsOffset,
        verticesOffset: verticesOffset
      });
      prevScale = (bb.y2 - bb.y1) / glyph.height;
      prevWidth = bb.x2 - bb.x1;
      transformsOffset += transformsSize;
      verticesOffset += verticesSize;
      offsetX = deltaX;
    });
    this.bb = this.maximBb(bbs);
    this._verticesSize = verticesOffset;
    this._transformsSize = transformsOffset;
    return glyphs;
  }

  maximBb(bbs): vec4 {

    // let min = vec2.fromValues(Infinity, Infinity);
    // let max = vec2.fromValues(-Infinity, -Infinity);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    bbs.forEach((bb) => {
      if (bb.x1 < minX) {
        minX = bb.x1;
      }

      if (bb.y1 < minY) {
        minY = bb.y1;
      }

      if (bb.x2 > maxX) {
        maxX = bb.x2;
      }

      if (bb.y2 > maxY) {
        maxY = bb.y2;
      }
    })
    return vec4.fromValues(minX, minY, maxX, maxY);
  }

  getAttributes() {
    return new Float32Array ([this.fontParser.font.unitsPerEm]);
  }


  computeGlyphSize(glyph: Glyph, advWidth: number): vec2 {
    const glyphSize = 5000;
    const glyphWidth = advWidth * glyphSize;
    const glyphHeight = glyphSize;

    // return vec4.fromValues();
    // const { width, height } = glyph;
    // const scale = advWidth / width;
    // return vec2.fromValues(width * scale, height * scale);
  }



  createTransformsBuffer() {
    const buffer = new Float32Array(this._transformsSize);
    let offset = 0;
    for (let i = 0; i < this._glyphs.length; i++) {
      const glyph = this._glyphs[i];
      offset = glyph.transformsOffset;
      const model = glyph.model;

      buffer.set([glyph.length], offset);
      offset += 4;

      buffer.set(model, offset);
      offset += 16;

      buffer.set(glyph.bb, offset);

    }
    return buffer;
  }

    createVerticesBuffer() {
      const buffer = new Float32Array(this._verticesSize);
      let offset = 0;
      for (let i = 0; i < this._glyphs.length; i++) {
        const glyph = this._glyphs[i];
        offset = glyph.verticesOffset;
        const vertices = glyph.vertices;
        console.log('Offset', offset, vertices.length);
        buffer.set(vertices, offset);
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

  private setModel(shift: number, bb, glyph, offsetX, prevWidth) {
    const model = mat4.create();
    mat4.rotateY(model, model, -Math.PI / 2);

    const width = bb.x2 - bb.x1;
    const height = bb.y2 - bb.y1;
    const totalHeight = glyph.height;

    const scaleFactor = height / totalHeight;
    const scalingX = width / totalHeight;

    
    let deltaX = offsetX;
    if (width < prevWidth) {
      deltaX += 1/2 *((prevWidth / totalHeight) - (width / totalHeight));
    }
    else if (width > prevWidth) {
      deltaX += 0.5* ((prevWidth / totalHeight) - (width / totalHeight));
    }
    console.log('ScalingX, deltaX', scalingX, deltaX);
    mat4.translate(model, model, [scalingX + deltaX, 0, 0]);
    mat4.scale(model, model, [scalingX, scaleFactor, 1]);

    deltaX += scalingX;
    return { model, deltaX };
  }

  updateText(text: string) {
    this._text = text;
    this._glyphs = this.createGlyphs();
    this._verticesBuffer = this.createVerticesBuffer();
    this._transformsBuffer = this.createTransformsBuffer();
  }

  async updateFont(font: string) {
    await this.fontParser.changeFont(font);
    this._glyphs = this.createGlyphs();
    this._verticesBuffer = this.createVerticesBuffer();
    this._transformsBuffer = this.createTransformsBuffer();
  }

  resetText() {
    this.fontParser.reset();
  }
}
