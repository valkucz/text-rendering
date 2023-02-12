import { vec2, vec3 } from "gl-matrix";
import shader from "../../shaders/shaders.wgsl";
import { VertexBuffer } from "../vertexBuffer";

export type Vertices = vec3[] | vec2[] | vec2[][];

export class Renderer {
  ctx: GPUCanvasContext;
  device: GPUDevice;
  format: GPUTextureFormat;
  pipeline: GPURenderPipeline;
  vertexBuffer: VertexBuffer;

  constructor(
    ctx: GPUCanvasContext,
    device: GPUDevice,
    vertexBuffer: VertexBuffer,
    format: GPUTextureFormat = "bgra8unorm"
  ) {
    this.ctx = ctx;
    this.device = device;
    this.format = format;
    this.vertexBuffer = vertexBuffer;

    this.ctx.configure({
      device: device,
      format: format,
      alphaMode: "premultiplied",
    });

    // create pipeline
    this.pipeline = this.createPipeline();
  }

  createPipeline(): GPURenderPipeline {
    return this.device.createRenderPipeline({
      vertex: {
        module: this.device.createShaderModule({
          code: shader,
        }),
        entryPoint: "vs_main",
        buffers: [this.vertexBuffer.bufferLayout],
      },
      fragment: {
        module: this.device.createShaderModule({
          code: shader,
        }),
        entryPoint: "fs_main",
        targets: [
          {
            format: this.format,
          },
        ],
      },
      primitive: {
        topology: "line-strip",
      },
      layout: "auto",
    });
  }

  render(vertices: Vertices) {
    const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();
    // update vertices in the Curve class
    this.vertexBuffer.update(vertices);

    const textureView: GPUTextureView = this.ctx
      .getCurrentTexture()
      .createView();
    const renderpass: GPURenderPassEncoder =
      commandEncoder.beginRenderPass({
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });
    renderpass.setPipeline(this.pipeline);
    renderpass.setVertexBuffer(0, this.vertexBuffer.buffer);
    renderpass.draw(this.vertexBuffer.getVertexCount(), 1, 0, 0);
    renderpass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
