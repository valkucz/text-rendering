import { mat4, vec2, vec4 } from "gl-matrix";
import { Glyph } from "./glyph";
import { FontParser } from "../../fonts/fontParser";
import { VertexBuffer } from "./vertexBuffer";

const defaultColor = [0.0, 0.0, 0.0, 1.0];
const defaultBgColor = [0.0, 1.0, 1.0, 0.0];

export interface TextBlockOptions {
  color?: number[];
  backgroundColor?: number[];
  spacing?: number;
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
  private _isWinding: boolean;
  fontParser: FontParser;
  device: GPUDevice;
  color: number[];
  bgColor: number[];

  bb: vec4;

  /*
  
  options = {
    color: [0.0, 0.0, 0.0, 1.0],
    backgroundColor: [0.0, 1.0, 1.0, 0.0],
    spacing: 1.0,
    fill_winding: true,
  }
  */
  constructor(
    device: GPUDevice,
    text: string,
    fontParser: FontParser,
    options?: TextBlockOptions
  ) {
    this.device = device;
    this._text = text;
    this.fontParser = fontParser;
    this.color = options?.color ?? defaultColor;
    this.bgColor = options?.backgroundColor ?? defaultBgColor;
    this._colorBuffer = this.createVertexBuffer(device, this.getColorArray());
    this._spacing = options?.spacing ?? 1.0;
    this._isWinding = options?.isWinding ?? true;
    this._verticesSize = 0;
    this._transformsSize = 0;
    this._glyphs = this.createGlyphs();
    this._verticesBuffer = this.createVerticesBuffer();
    this._transformsBuffer = this.createTransformsBuffer();

    this.bb = vec4.create();
  }

  public get spacing(): number {
    return this._spacing;
  }

  public set spacing(spacing: number) {
    this._spacing = spacing;
    this._glyphs.forEach((glyph) => {
      // set matrix
    });
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
    return new Float32Array(this.color.concat(this.bgColor));
  }
  private createVertexBuffer(
    device: GPUDevice,
    vertices: Float32Array
  ): VertexBuffer {
    return new VertexBuffer(device, vertices);
  }

  private updateGlyphs() {
    this._glyphs = this.createGlyphs();
    this._verticesBuffer = this.createVerticesBuffer();
    this._transformsBuffer = this.createTransformsBuffer();
  }
  private createGlyphs(): Glyph[] {
    console.log(this._text);
    const alignment = this.device.limits.minStorageBufferOffsetAlignment;
    const glyphs: Glyph[] = [];
    let transformsOffset = 0;
    let verticesOffset = 0;
    let prevWidth = 0;
    let offsetX = 0;
    this.fontParser.parseText(this._text, this._isWinding).forEach((glyph) => {
      const { bb, vertices } = glyph;
      let transformsSize = Math.ceil(21 / alignment) * alignment;
      let verticesSize = Math.ceil(vertices.length / alignment) * alignment;
      const width = bb.x2 - bb.x1;
      const height = bb.y2 - bb.y1;

      const { model, deltaX } = this.setModel(width, height, glyph.height, offsetX, prevWidth);
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
      prevWidth = width;
      transformsOffset += transformsSize;
      verticesOffset += verticesSize;
      offsetX = deltaX;
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

  private setModel(width: number, height: number, totalHeight: number, offsetX: number, prevWidth: number) {
    const model = mat4.create();
    
    const scaleFactor = height / totalHeight;
    const scalingX = width / totalHeight;
    
    let deltaX = offsetX;
    if (width != prevWidth) {
      deltaX += 1/2 * ((prevWidth - width) / totalHeight);
    }

    mat4.rotateY(model, model, -Math.PI / 2);
    mat4.translate(model, model, [scalingX + deltaX, 0.5 * scaleFactor, 0]);
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
