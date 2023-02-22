import { mat4, vec2, vec3 } from "gl-matrix";
import shader from "../../shaders/shaders.wgsl";
import { conversionFactor } from "../main";
import { VertexBuffer } from "../vertexBuffer";

export type Vertices = vec3[] | vec2[] | vec2[][];

export class Renderer {
  ctx: GPUCanvasContext;
  device: GPUDevice;
  format: GPUTextureFormat;
  pipeline: GPURenderPipeline;
  vertexBuffer: VertexBuffer;
  bindGroup: GPUBindGroup;
  uniformBuffer: GPUBuffer;

  // matrices
  model: mat4;
  view: mat4;
  projection: mat4;

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

    this.uniformBuffer = this.device.createBuffer({
      size: 64 * 3,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  });


    // create pipeline
    this.pipeline = this.createPipeline();
  }

  createPipeline(): GPURenderPipeline {
  
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
          {
              binding: 0,
              visibility: GPUShaderStage.VERTEX,
              buffer: {}
          }
      ]

  });

  this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
          {
              binding: 0,
              resource: {
                  buffer: this.uniformBuffer
              }
          }
      ]
  });
  const pipelineLayout = this.device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout]
});
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
      layout: pipelineLayout,
    });
  }

  render(t: number, x: number, vec: vec3) {
    const commandEncoder: GPUCommandEncoder = this.device.createCommandEncoder();
    // update vertices in the Curve class
    // this.vertexBuffer.update(vertices);
    
    this.model = mat4.create();
    this.projection = mat4.create();
    this.view = mat4.create();

    // project matrix
    mat4.perspective(this.projection, Math.PI / 4, conversionFactor[0] / conversionFactor[1], 0.1, 10);
    // lookAt view matrix
    mat4.lookAt(this.view, [x, 0, 1], [0, 0, 0], [0, 0, 1]);
    // rotate model matrix
    mat4.rotate(this.model, this.model, t, vec)
    
    
    this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>this.model);
    this.device.queue.writeBuffer(this.uniformBuffer, 64, <ArrayBuffer>this.view);
    this.device.queue.writeBuffer(this.uniformBuffer, 128, <ArrayBuffer>this.projection);

    console.log(this.ctx.getCurrentTexture())
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
    renderpass.setBindGroup(0, this.bindGroup);
    renderpass.draw(this.vertexBuffer.getVertexCount(), 1, 0, 0);
    renderpass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
