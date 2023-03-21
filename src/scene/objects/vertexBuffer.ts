import { vec2 } from "gl-matrix";
import { vec2ToFloat32 } from "../../math";

export class VertexBuffer {
  vertices: Float32Array;

  device: GPUDevice;

  usage: number = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;

  buffer: GPUBuffer;

  constructor(device: GPUDevice, vertices: Float32Array) {
    this.device = device;
    this.vertices = vertices;

    this.buffer = this.createBuffer();

    this.buffer.unmap();
  }

  createBuffer(): GPUBuffer {
    return this.device.createBuffer({
      size: this.vertices.byteLength * 4,
      usage: this.usage,
      mappedAtCreation: true,
    });
  }

  // TODO: delete from SceneObject
  update(vertices: Float32Array): void {
    this.vertices = vertices;
  }

  getVertexCount(): number {
    return this.vertices.length;
  }

  // TODO: why is it here, move to glyph?
  getBoundingBox(): Float32Array {
    const min = vec2.fromValues(Infinity, Infinity);
    const max = vec2.fromValues(-Infinity, -Infinity);

    for (let i = 0; i < this.vertices.length; i += 2) {
      const x = this.vertices[i];
      const y = this.vertices[i + 1];

      vec2.min(min, min, vec2.fromValues(x, y));
      vec2.max(max, max, vec2.fromValues(x, y));
    }
    return vec2ToFloat32([min, max]);
  }
}
