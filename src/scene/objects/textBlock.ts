import { mat4, vec2, vec4 } from "gl-matrix";
import { Glyph } from "./glyph";
import { FontParser } from "../../fonts/fontParser";
import { VertexBuffer } from "./vertexBuffer";

const defaultColor = [0.0, 0.0, 0.0, 1.0];
const defaultBgColor = [0.0, 1.0, 1.0, 0.0];

const velocity = 0.125;
export interface TextBlockOptions {
  color?: number[];
  backgroundColor?: number[];
  spacing?: number;
  width?: number;
  isWinding?: boolean;
}
export class TextBlock {
  private _verticesSize: number;
  private _transformsSize: number;
  private _text: string;
  private _verticesBuffer: Float32Array;
  private _transformsBuffer: Float32Array;
  private _glyphs: Glyph[];
  private _colorBuffer: VertexBuffer;
  private _spacing: number;
  private _width: number;
  private _isWinding: boolean;
  fontParser: FontParser;
  device: GPUDevice;
  private _color: number[];
  private _bgColor: number[];

  bb: vec4;

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
    this._bgColor = options?.backgroundColor ?? defaultBgColor;
    this._colorBuffer = this.createVertexBuffer(device, this.getColorArray());
    this._spacing = options?.spacing ?? 1.0;
    this._width = options?.width ?? 1.0;
    this._isWinding = options?.isWinding ?? true;
    this._verticesSize = 0;
    this._transformsSize = 0;
    this._glyphs = this.createGlyphs();
    this.setMatrices();
    this._verticesBuffer = this.createVerticesBuffer();
    this._transformsBuffer = this.createTransformsBuffer();

    this.bb = vec4.create();
  }

  public set color(color: number[]) {
    this._color = color;
    this._colorBuffer = this.createVertexBuffer(this.device, this.getColorArray());
  }

  public get color(): number[] {
    return this._color;
  }

  public set bgColor(bgColor: number[]) {
    this._bgColor = bgColor;
    this._colorBuffer = this.createVertexBuffer(this.device, this.getColorArray());
  }

  public get spacing(): number {
    return this._spacing;
  }

  public get width(): number {
    return this._width;
  }

  public set width(width: number) {
    this._width = width * velocity;
    this.setMatrices();
    this._transformsBuffer = this.createTransformsBuffer();
  }

  public set spacing(spacing: number) {
    this._spacing = spacing * velocity;
    this.setMatrices();
    this._transformsBuffer = this.createTransformsBuffer();
  }

  public get isWinding() : boolean {
    return this._isWinding;
  }

  public set isWinding(value: boolean) {
    if (value != this._isWinding){
      this._isWinding = value;
      this.updateGlyphs();
    }
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
    return new Float32Array(this._color.concat(this._bgColor));
  }
  private createVertexBuffer(
    device: GPUDevice,
    vertices: Float32Array
  ): VertexBuffer {
    return new VertexBuffer(device, vertices);
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
        model: mat4.create(),
        bb: vec4.fromValues(bb.x1, bb.y1, bb.x2, bb.y2),
        length: vertices.length / 2,
        transformsSize: transformsSize,
        verticesSize: verticesSize,
        transformsOffset: transformsOffset,
        verticesOffset: verticesOffset
      });
      transformsOffset += transformsSize;
      verticesOffset += verticesSize;
    });
    this._verticesSize = verticesOffset;
    this._transformsSize = transformsOffset;
    return glyphs;
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
    const totalHeight = this.fontParser.height;
    this._glyphs.forEach((glyph, i) => {
      if (i > 0 && i % 25 == 0) {
        offsetY++;
        offsetX = 0;
      }
      let width = glyph.bb[2] - glyph.bb[0];
      let height = glyph.bb[3] - glyph.bb[1];
      offsetX = this.setModel(glyph.model, width, height, totalHeight, offsetX, offsetY, prevWidth);
      prevWidth = width;
    });

  }


  private setModel(model: mat4, width: number, height: number, totalHeight: number, offsetX: number, offsetY: number, prevWidth: number) {
    
    const scaleFactor = height / totalHeight;
    const scalingX =  width * this._width / totalHeight;
    
    let deltaX = offsetX;
    if (width != prevWidth) {
      deltaX += (1/2 * ((prevWidth - width) / totalHeight));
    }
    
    mat4.rotateY(model, model, -Math.PI / 2);
    mat4.translate(model, model, [(scalingX + deltaX * this._spacing * this._width), 0.5 * scaleFactor, 0]);
    mat4.scale(model, model, [scalingX, scaleFactor, 1]);
    // mat4.translate(model, model, [0, -5 / scaleFactor * offsetY, 0]);
    deltaX += scalingX;
    return deltaX;
  }

  updateText(text: string) {
    this._text = text;
    this.updateGlyphs();
  }

  async updateFont(font: string) {
    await this.fontParser.changeFont(font);
    this.updateGlyphs();

  }

  resetText() {
    this.fontParser.resetFont();
  }
}
