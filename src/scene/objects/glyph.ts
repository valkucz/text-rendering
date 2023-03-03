import { mat4, vec2, vec3 } from "gl-matrix";
import { getBezierGlyph } from "../../bezier";
import { conversionFactor } from "../../main";
import { vec2ToFloat32 } from "../../math";
import { SceneObject } from "./sceneObject";

export class Glyph implements SceneObject {
    buffer: GPUBuffer;
    
    vertices: Float32Array;
  
    device: GPUDevice;

    model: mat4 = mat4.create();
  
    usage: number = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
  constructor(device: GPUDevice, vertices: vec2[][]) {
    this.device = device;

    mat4.translate(this.model, this.model, [0, 0, 0]);

    // TODO: make prettier
    // TODO: or send conversionFactor with camera matrices
    this.vertices = vec2ToFloat32([conversionFactor].concat(vertices.flat()));

    this.buffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: this.usage,
      mappedAtCreation: true,
    });
    // TODO: no need
    new Float32Array(this.buffer.getMappedRange()).set(this.vertices);

    this.buffer.unmap();
  }
  // TODO: delete from SceneObject
  update(vertices: any[]): void {
    throw new Error("Method not implemented.");
  }
  
  getVertexCount(): number {
    // + conversion factor
    return this.vertices.length / 2 + 1;
  }


}
