/**
 * PerFrameData is a data structure that is created for each frame and
 * contains the data that is needed to render a frame in Renderer class.
 * @example
 * const perFrameData = renderer.prepare();
 * renderer.render(perFrameData);
 *
 */
export interface PerFrameData {
  uniformBindGroup: GPUBindGroup;
  glyphBindGroups: GPUBindGroup[];
  commandEncoder: GPUCommandEncoder;
  renderPass: GPURenderPassEncoder;
}
