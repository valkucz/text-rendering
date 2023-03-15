import { mat4 } from "gl-matrix";
import { degToRad } from "../../math";
import { SceneObject } from "./sceneObject";
import { VertexBuffer } from "./vertexBuffer";

export class Glyph implements SceneObject {
  model: mat4 = mat4.create();

  velocity: number = 1;

  vertexBuffer: VertexBuffer;

  defaultAngle: number = 90;

  // FIXME: change
  defaultPosition: number = 0;

  constructor(device: GPUDevice, vertices: Float32Array) {
    this.vertexBuffer = this.createVertexBuffer(device, vertices);

    this.setModel();
  }

  createVertexBuffer(device: GPUDevice, vertices: Float32Array): VertexBuffer {
    return new VertexBuffer(device, vertices);
  }

  setModel() {
    // for default setting, use fromXRotation?
    // https://glmatrix.net/docs/module-mat4.html
    mat4.rotateY(this.model, this.model, Math.PI / 2);
    mat4.scale(this.model, this.model, [0.5, 0.5, 0.5]);
  }

  // Scene methods:
  // TODO: change
  rotate(): void {
    const max = 18;
    mat4.rotateY(this.model, this.model, (Math.PI / 2) * this.velocity);
  }
  
  rotateX(value: number): void {
    // value < 0, 360 >, initial 90 => Math.PI / 2
    mat4.rotateX(this.model, this.model, degToRad(value) * this.velocity);
  }

  rotateY(value: number): void {
    // value < 0, 360 >, initial 90 => Math.PI / 2
    mat4.rotateY(this.model, this.model, degToRad(value) * this.velocity);
  }

  rotateZ(value: number): void {
    // value < 0, 360 >, initial 90 => Math.PI / 2
    mat4.rotateZ(this.model, this.model, degToRad(value) * this.velocity);
  }

  move(): void {
  }

  scale(): void {

  }
}
