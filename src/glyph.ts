import { vec2 } from "gl-matrix";
import { getBezierGlyph } from "./bezier";
import { VertexBuffer } from "./vertexBuffer";

export class Glyph implements VertexBuffer {
    buffer: GPUBuffer;

    bufferLayout: GPUVertexBufferLayout;
  
    vertices: Float32Array;
  
    device: GPUDevice;
  
    usage: number = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
  constructor(device: GPUDevice, vertices: vec2[][]) {
    this.device = device;

    this.vertices = getBezierGlyph(vertices);

    this.buffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: this.usage,
      mappedAtCreation: true,
    });
    new Float32Array(this.buffer.getMappedRange()).set(this.vertices);

    this.buffer.unmap();

    this.bufferLayout = {
      // 2 * (32b = 4B) = 8
      arrayStride: 20,
      attributes: [
        {
          shaderLocation: 0,
          format: "float32x2",
          offset: 0,
        },
        {
          shaderLocation: 1,
          format: "float32x3",
          offset: 8,
        },
      ],
    };
  }
  getVertexCount(): number {
    return this.vertices.length / 5;
  }

  update(vertices: vec2[][]): void {
    if (vertices.length === 0) {
        return;
    }
    this.vertices = getBezierGlyph(vertices);

    this.buffer = this.device.createBuffer({
      size: this.vertices.byteLength,
      usage: this.usage,
      mappedAtCreation: true,
    });

    new Float32Array(this.buffer.getMappedRange()).set(this.vertices);

    this.buffer.unmap();
  }
}
