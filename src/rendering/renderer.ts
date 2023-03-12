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
  bindGroupLayout: GPUBindGroupLayout;
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

    // bind group layout
    this.bindGroupLayout = this.createBindGroupLayout();

    this.ctx.configure({
      device: device,
      format: format,
      alphaMode: "premultiplied",
    });

    // create uniform buffer
    this.uniformBuffer = this.createUniformBuffer();

    // create pipeline
    this.pipeline = this.createPipeline();
  }

  createBindGroupLayout(): GPUBindGroupLayout {
    return this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "storage",
          },
        }
      ],
    });
  }

  createUniformBuffer(): GPUBuffer {
    return this.device.createBuffer({
      // mat4 = 4*4*(4 bytes) +  1 * 4(bytes) (length) + 4 * 4(bytes) (minmax)
      size: 64 * 3 + 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  createBufferLayout(): GPUVertexBufferLayout {
    return {
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
  }
  createBindGroup(buffer: GPUBuffer): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: buffer,
          },
        }
      ],
    });
  }

  createPipeline(): GPURenderPipeline {
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });

    return this.device.createRenderPipeline({
      vertex: {
        module: this.device.createShaderModule({
          code: shader,
        }),
        entryPoint: "vs_main",
        // buffers: [bufferLayout],
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

  render(object: SceneObject) {

    const bindGroup = this.createBindGroup(object.buffer);

    const commandEncoder: GPUCommandEncoder =
      this.device.createCommandEncoder();

    const vertLength = new Float32Array(1);
    vertLength[0] = (object.vertices.length - 4) / 4;

    // Camera attribtues
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      64,
      <ArrayBuffer>this.camera.view
    );

    this.device.queue.writeBuffer(
      this.uniformBuffer,
      128,
      <ArrayBuffer>this.camera.projection
    );

    this.device.queue.writeBuffer(
      this.uniformBuffer,
      192,
      <ArrayBuffer>vertLength
    )

    // move model here
    // remove from object attr
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      <ArrayBuffer>object.model);

    this.device.queue.writeBuffer(
      object.buffer,
      0,
      object.vertices.buffer
    )
    
    
    const textureView: GPUTextureView = this.ctx
      .getCurrentTexture()
      .createView();

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

    renderpass.setBindGroup(0, bindGroup);

    renderpass.draw(6, 1, 0, 0);

    renderpass.end();


    this.device.queue.submit([commandEncoder.finish()]);
  }
}
