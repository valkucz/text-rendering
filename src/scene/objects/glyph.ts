import { SceneObject } from "./sceneObject";
import { VertexBuffer } from "./vertexBuffer";

  // TODO: square for each glyph?
export class Glyph extends SceneObject {

  vertexBuffer: VertexBuffer;

  colorBuffer: VertexBuffer;

  color: number[] = [0.0, 0.0, 0.0, 1.0];

  // move it
  background: number[] = [1.0, 0.0, 1.0, 1.0];


  constructor(device: GPUDevice, vertices: Float32Array) {
    super();

    this.vertexBuffer = this.createVertexBuffer(device, vertices);

    this.colorBuffer = this.createVertexBuffer(device, this.getColor());
  }

  getColor(): Float32Array {
    return  new Float32Array(this.color.concat(this.background));
  }

  createVertexBuffer(device: GPUDevice, vertices: Float32Array): VertexBuffer {
    return new VertexBuffer(device, vertices);
  }
}
