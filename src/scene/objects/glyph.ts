import { SceneObject } from "./sceneObject";
import { VertexBuffer } from "./vertexBuffer";

const defaultColor = [0.0, 0.0, 0.0, 1.0];
const defaultBgColor = [1.0, 1.0, 1.0, 1.0];
// TODO: square for each glyph?
export class Glyph extends SceneObject {
  vertexBuffer: VertexBuffer;

  colorBuffer: VertexBuffer;

  initColor: number[];

  initBgColor: number[];

  color: number[];

  backgroundColor: number[];

  constructor(device: GPUDevice, vertices: Float32Array, color?: number[], backgroundColor?: number[]) {
    super();

    this.color = color ?? defaultColor;

    this.initColor = color ?? defaultColor;

    this.backgroundColor = backgroundColor ?? defaultBgColor;

    this.initBgColor = backgroundColor ?? defaultBgColor;
    
    this.vertexBuffer = this.createVertexBuffer(device, vertices);
    
    this.colorBuffer = this.createVertexBuffer(device, this.getColor());

  }

  getColor(): Float32Array {
    // console.log(this.color)
    return new Float32Array(this.color.concat(this.backgroundColor));
  }

  createVertexBuffer(device: GPUDevice, vertices: Float32Array): VertexBuffer {
    return new VertexBuffer(device, vertices);
  }

  updateColor() {
    this.colorBuffer.update(this.getColor());
  }

  updateVertices(vertices: Float32Array) {
    this.vertexBuffer.update(vertices);
  }

  resetColor() {
    const changed = this.color != this.initBgColor || this.backgroundColor != this.initBgColor;
    this.color = this.initColor;
    this.backgroundColor = this.initBgColor;

    if (changed) {
      this.updateColor();
    }


  }

  
}
