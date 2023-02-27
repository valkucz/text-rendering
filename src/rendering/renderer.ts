import { vec2, vec3 } from "gl-matrix";
import shader from "../shaders/shaders.wgsl";
import { SceneObject } from "../scene/objects/sceneObject";
import { Camera } from "../scene/camera";
import { Square } from "../scene/objects/square";

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
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
          },
        }
      ],
    });
  }

  createUniformBuffer(): GPUBuffer {
    return this.device.createBuffer({
      size: 64 * 3,
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

    const bufferLayout = this.createBufferLayout();

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

  render(square: Square, object: SceneObject) {

    const bindGroup = this.createBindGroup(square.buffer);
    const commandEncoder: GPUCommandEncoder =
      this.device.createCommandEncoder();

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
    

    
    for (let i = 0; i < 18; i += 3) {
      let offset = i * 4;
      this.device.queue.writeBuffer(
        square.buffer,
        offset,
        new Float32Array([square.v2[i], square.v2[i + 1], square.v2[i + 2]])
      )
    }

    
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

    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      <ArrayBuffer>object.model);
      // set bindGroup for objects at location 1
      
      renderpass.setVertexBuffer(0, object.buffer);
      renderpass.draw(object.getVertexCount(), 1, 0, 0);
    ;

    renderpass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
