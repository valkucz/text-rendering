import { mat4, vec3 } from "gl-matrix";
import { degToRad } from "../../math";
import { SceneObject } from "./sceneObject";
import { VertexBuffer } from "./vertexBuffer";

  // TODO: square for each glyph?
export class Glyph extends SceneObject {
  model: mat4 = mat4.create();


  vertexBuffer: VertexBuffer;

  defaultAngle: number = 90;

  // FIXME: change
  defaultPosition: number = 0;


  constructor(device: GPUDevice, vertices: Float32Array) {
    super();
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
    // mat4.rotateZ(this.model, this.model, -Math.PI);
    mat4.scale(this.model, this.model, [0.5, 0.5, 0.5]);
  }

  // Scene methods:
  // TODO: change
  rotate(): void {
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

  move(vec: vec3): void {
    vec3.scale(vec, vec, this.velocity);
    mat4.translate(this.model, this.model, vec);
  }

  scale(value: number): void {
    mat4.scale(this.model, this.model, [value, value, value]);

  }
}
