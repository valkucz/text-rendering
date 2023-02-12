// TODO: make this abstract class to avoid repetitve code in Curve and Glyph
export interface VertexBuffer {
  buffer: GPUBuffer;

  bufferLayout: GPUVertexBufferLayout;

  vertices: Float32Array;

  device: GPUDevice;

  usage: number;

  /**
   * @returns number of vertices to draw
   */
  getVertexCount(): number;

  /**
   * Updates GPU buffer with new vertices
   * @param vertices
   */
  update(vertices: any[]): void;
}
