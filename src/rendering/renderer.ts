import { vec2, vec3 } from "gl-matrix";
import shader from "../shaders/shaders.wgsl";
import { SceneObject } from "../scene/objects/sceneObject";
import { Camera } from "../scene/camera";

export type Vertices = vec3[] | vec2[] | vec2[][];

export class Renderer {
  ctx: GPUCanvasContext;
  device: GPUDevice;
  format: GPUTextureFormat;
  pipeline: GPURenderPipeline;
  bindGroup: GPUBindGroup;
  uniformBuffer: GPUBuffer;
  camera: Camera;

  constructor(
    ctx: GPUCanvasContext,
    device: GPUDevice,
    camera: Camera,
    format: GPUTextureFormat = "bgra8unorm"
  ) {
    this.ctx = ctx;
    this.device = device;
    this.format = format;
    this.camera = camera;

    this.ctx.configure({
      device: device,
      format: format,
      alphaMode: "premultiplied",
    });

    this.uniformBuffer = this.device.createBuffer({
      size: 64 * 3,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
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
          buffer: {},
        },
      ],
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer,
          },
        },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    const bufferLayout: GPUVertexBufferLayout = {
      arrayStride: 24,
      attributes: [
        {
          shaderLocation: 0,
          format: "float32x3",
          offset: 0,
        },
        {
          shaderLocation: 1,
          format: "float32x3",
          offset: 12,
        },
      ],
    };

    return this.device.createRenderPipeline({
      vertex: {
        module: this.device.createShaderModule({
          code: shader,
        }),
        entryPoint: "vs_main",
        buffers: [bufferLayout],
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
        topology: "triangle-list",
      },
      layout: pipelineLayout,
    });
  }

  render(objects: SceneObject[]) {
    const commandEncoder: GPUCommandEncoder =
      this.device.createCommandEncoder();
    // update vertices in the Curve class
    // this.vertexBuffer.update(vertices);

    // inversion of view matrix
    // const viewInverse = mat4.create();
    // mat4.invert(viewInverse, this.camera.view);
    // rotate model matrix
    // mat4.rotate(this.model, this.model, 0, [0, 0, 0]);
    this.device.queue.writeBuffer(this.uniformBuffer, 64, <ArrayBuffer>this.camera.view);
    this.device.queue.writeBuffer(this.uniformBuffer, 128, <ArrayBuffer>this.camera.projection);

    const textureView: GPUTextureView = this.ctx.getCurrentTexture().createView();
  
    const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
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

    objects.forEach((object) => {
      this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>object.model);
      renderpass.setVertexBuffer(0, object.buffer);
      renderpass.setBindGroup(0, this.bindGroup);
      renderpass.draw(object.getVertexCount(), 1, 0, 0);
    });

    renderpass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
