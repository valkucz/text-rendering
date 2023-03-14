import { mat4 } from "gl-matrix";
import { SceneObject } from "./sceneObject";
import { VertexBuffer } from "./vertexBuffer";

export class Glyph implements SceneObject {
  model: mat4 = mat4.create();

  velocity: number = 0.2;

  vertexBuffer: VertexBuffer;

  constructor(device: GPUDevice, vertices: Float32Array) {
    this.vertexBuffer = this.createVertexBuffer(device, vertices);

    this.setModel();
  }

  createVertexBuffer(device: GPUDevice, vertices: Float32Array): VertexBuffer {
    return new VertexBuffer(device, vertices);
  }

  setModel() {
    mat4.rotateY(this.model, this.model, Math.PI / 2);
    mat4.scale(this.model, this.model, [0.5, 0.5, 0.5]);
  }

  // Scene methods:
  // TODO: change
  rotate(): void {
    const max = 18;
    mat4.rotateY(this.model, this.model, (Math.PI / max) * this.velocity);
  }

  move(): void {
  }

  scale(): void {

  }
}
