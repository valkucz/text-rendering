import { mat4, vec2 } from "gl-matrix";
import { vec2ToFloat32 } from "../../math";
import { SceneObject } from "./sceneObject";

export class Glyph implements SceneObject {
    buffer: GPUBuffer;
    
    vertices: Float32Array;
  
    device: GPUDevice;

    model: mat4 = mat4.create();
  
    usage: number = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
  constructor(device: GPUDevice, vertices: vec2[][]) {
    this.device = device;

    mat4.rotateY(this.model, this.model, Math.PI / 2);
    mat4.scale(this.model, this.model, [0.5, 0.5, 0.5]);
    // TODO: make prettier

    // TODO: or send conversionFactor with camera matrices

    this.vertices = vec2ToFloat32(vertices.flat());

    this.buffer = this.device.createBuffer({
      size: this.vertices.byteLength * 4,
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
  
  // TODO: remove
  getVertexCount(): number {
    return this.vertices.length;
  }


}
