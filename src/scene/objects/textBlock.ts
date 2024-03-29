import { mat4, vec4 } from "gl-matrix";
import { Glyph } from "./glyph";
import { FontParser } from "../../fonts/fontParser";
import { TextBlockOptions } from "./textBlockOptions";

const defaultColor = [0.0, 0.0, 0.0, 1.0];
const velocity = 0.125;

export class TextBlock {
  private _verticesSize: number;
  private _transformsSize: number;
  private _text: string;
  private _verticesBuffer: Float32Array;
  private _transformsBuffer: Float32Array;
  private _colorBuffer: Float32Array;
  private _glyphs: Glyph[];
  private _spacing: number;
  private _width: number;
  private _size: number;
  private _isWinding: boolean;
  private _color: number[];
  fontParser: FontParser;
  device: GPUDevice;

  constructor(
    device: GPUDevice,
    text: string,
    fontParser: FontParser,
    options?: TextBlockOptions
  ) {
    this.device = device;
    this._text = text;
    this.fontParser = fontParser;
    this._color = options?.color ?? defaultColor;
    this._colorBuffer = new Float32Array(this._color);
    this._spacing = options?.spacing ?? 1.0;
    this._width = options?.width ?? 1.0;
    this._size = options?.size ?? 1.0;
    this._isWinding = options?.isWinding ?? true;
    this._verticesSize = 0;
    this._transformsSize = 0;
    this._glyphs = this.createGlyphs();
    this.setMatrices();
    this._verticesBuffer = this.createVerticesBuffer();
    this._transformsBuffer = this.createTransformsBuffer();
  }

  private updateGlyphs() {
    this._glyphs = this.createGlyphs();
    this.setMatrices();
    this._verticesBuffer = this.createVerticesBuffer();
    this._transformsBuffer = this.createTransformsBuffer();
  }

  private createGlyphs(): Glyph[] {
    const alignment = this.device.limits.minStorageBufferOffsetAlignment;
    const glyphs: Glyph[] = [];
    let transformsOffset = 0;
    let verticesOffset = 0;
    this.fontParser.parseText(this._text, this._isWinding).forEach((glyph) => {
      const { bb, vertices } = glyph;
      let transformsSize = Math.ceil(21 / alignment) * alignment;
      let verticesSize = Math.ceil(vertices.length / alignment) * alignment;
      glyphs.push({
        vertices: vertices,
        modelMatrix: mat4.create(),
        boundingBox: vec4.fromValues(bb.x1, bb.y1, bb.x2, bb.y2),
        length: vertices.length / 2,
        transformsSize: transformsSize,
        verticesSize: verticesSize,
        transformsOffset: transformsOffset,
        verticesOffset: verticesOffset,
      });
      transformsOffset += transformsSize;
      verticesOffset += verticesSize;
    });
    this._verticesSize = verticesOffset;
    this._transformsSize = transformsOffset;
    return glyphs;
  }

  private createTransformsBuffer() {
    const buffer = new Float32Array(this._transformsSize);
    let offset = 0;
    for (let i = 0; i < this._glyphs.length; i++) {
      const glyph = this._glyphs[i];
      offset = glyph.transformsOffset;
      const model = glyph.modelMatrix;

      buffer.set([glyph.length], offset);
      offset += 4;

      buffer.set(model, offset);
      offset += 16;

      buffer.set(glyph.boundingBox, offset);
    }
    return buffer;
  }

  private createVerticesBuffer() {
    const buffer = new Float32Array(this._verticesSize);
    let offset = 0;
    for (let i = 0; i < this._glyphs.length; i++) {
      const glyph = this._glyphs[i];
      const vertices = glyph.vertices;
      offset = glyph.verticesOffset;
      buffer.set(vertices, offset);
    }
    return buffer;
  }

  private setMatrices() {
    let offsetX = 0;
    let prevWidth = 0;
    let offsetY = 0;
    this._glyphs.forEach((glyph) => {
      // if (i > 0 && i % 25 == 0) {
      //   offsetY++;
      //   offsetX = 0;
      // }
      let width = glyph.boundingBox[2] - glyph.boundingBox[0];
      let height = glyph.boundingBox[3] - glyph.boundingBox[1];

      offsetX = this.setModel(
        width,
        height,
        offsetX,
        offsetY,
        glyph.boundingBox,
        glyph.modelMatrix,
        prevWidth
      );
      prevWidth = width;
    });
  }

  // OffsetY was for testing; for \n
  private setModel(
    width: number,
    height: number,
    offsetX: number,
    offsetY: number,
    bb: vec4,
    model: mat4,
    prevWidth: number
  ) {
    const totalHeight = 4 * this.fontParser.height;
    const scaleFactor = height / totalHeight;
    const scalingX = (width * this._width) / totalHeight;
  
    let deltaX = offsetX;
    if (width !== prevWidth) {
      deltaX += (prevWidth - width) / (2 * totalHeight);
    }
  
    mat4.identity(model);
    mat4.rotateY(model, model, -Math.PI / 2);
    mat4.translate(model, model, [
      (scalingX + deltaX * this._spacing) * this._size,
      (0.75 - bb[3] / totalHeight) * scaleFactor * this._size,
      0,
    ]);
    mat4.scale(model, model, [scalingX * this._size, scaleFactor * this._size, this._size]);
    
    // mat4.translate(model, model, [0, (-5 / scaleFactor) * offsetY, 0]);
    deltaX += scalingX;
    return deltaX;
  }
  

  public set text(text: string) {
    this._text = text;
    this.updateGlyphs();
  }

  async updateFont(font: string) {
    await this.fontParser.changeFont(font);
    this.updateGlyphs();
  }

  set color(color: number[]) {
    this._color = color;
    this._colorBuffer = new Float32Array(this._color);
  }

  get color(): number[] {
    return this._color;
  }

  get spacing(): number {
    return this._spacing;
  }

  get width(): number {
    return this._width;
  }

  get size(): number {
    return this._size;
  }

  set size(size: number) {
    this._size = size * velocity;
    this.setMatrices();
    this._transformsBuffer = this.createTransformsBuffer();
  } 

  set width(width: number) {
    this._width = width * velocity;
    this.setMatrices();
    this._transformsBuffer = this.createTransformsBuffer();
  }

  set spacing(spacing: number) {
    this._spacing = spacing * velocity;
    this.setMatrices();
    this._transformsBuffer = this.createTransformsBuffer();
  }

  get isWinding(): boolean {
    return this._isWinding;
  }

  set isWinding(value: boolean) {
    if (value != this._isWinding) {
      this._isWinding = value;
      this.updateGlyphs();
    }
  }

  get verticesBuffer() {
    return this._verticesBuffer;
  }

  get transformsBuffer() {
    return this._transformsBuffer;
  }

  get colorBuffer(): Float32Array {
    return this._colorBuffer;
  }

  get verticesSize(): number {
    return this._verticesSize;
  }

  get transformsSize(): number {
    return this._transformsSize;
  }

  get text(): string {
    return this._text;
  }

  get glyphs(): Glyph[] {
    return this._glyphs;
  }
}
