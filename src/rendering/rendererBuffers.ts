/**
 * RendererBuffers is a data structure that describes some of the buffers
 * used in the Renderer class.
 */

export interface RendererBuffers {
  uniform: GPUBuffer;
  glyph: GPUBuffer;
  transforms: GPUBuffer;
}
