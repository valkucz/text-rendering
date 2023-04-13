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
    return this.vertices.length / 2;
  }
}
