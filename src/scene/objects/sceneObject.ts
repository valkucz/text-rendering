import { mat4 } from "gl-matrix";

// TODO: make this abstract class to avoid repetitve code in Curve and Glyph
export interface SceneObject {
  buffer: GPUBuffer;

  vertices: Float32Array;

  device: GPUDevice;

  model: mat4;

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
