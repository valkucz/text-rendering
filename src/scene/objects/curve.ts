import { mat4, vec3 } from "gl-matrix";
import { getBezier } from "../../bezier";
import { vec3ToFloat32 } from "../../math";
import { SceneObject } from "./sceneObject";

// No need for this class
export class Curve implements SceneObject {
  buffer: GPUBuffer;

  vertices: Float32Array;

  device: GPUDevice;

  model: mat4 = mat4.create();

  usage: number = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;

  // TODO: vec2
  constructor(device: GPUDevice, vertices: vec3[]) {
    this.device = device;

    mat4.rotateY(this.model, this.model, Math.PI / 2);
    mat4.scale(this.model, this.model, [0.5, 0.5, 0.5]);
    // mat4.translate(this.model, this.model, [0, 0, 0]);

    // TODO: change this to vec2
    // vertices represent 3 control points of bezier line
    this.vertices = vec3ToFloat32(vertices);

    this.buffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: this.usage,
      mappedAtCreation: true,
    });

    // Why this is needed?
    // new Float32Array(this.buffer.getMappedRange()).set(this.vertices);

    this.buffer.unmap();
  }

  getVertexCount():number {
    // TODO: later change to 2; vec2 instead of vec3
    return this.vertices.length / 3;
  }


  update(vertices: vec3[]): void {
    this.vertices = getBezier(vertices);

    this.buffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: this.usage,
      mappedAtCreation: true,
    });

    new Float32Array(this.buffer.getMappedRange()).set(this.vertices);

    this.buffer.unmap();
  }
}
