import { vec2, vec3 } from "gl-matrix";
import shader from "../shaders/shaders.wgsl";
import { SceneObject } from "../scene/objects/sceneObject";
import { Camera } from "../scene/camera";
import { Glyph } from "../scene/objects/glyph";

const MAT4LENGTH = 64;
export class Renderer {
  ctx: GPUCanvasContext;
  device: GPUDevice;
  format: GPUTextureFormat;
  pipeline: GPURenderPipeline;
  bindGroupLayout: GPUBindGroupLayout;
  uniformBuffer: GPUBuffer;

  // Assets: 
  glyph: Glyph;
  camera: Camera

  constructor(
    ctx: GPUCanvasContext,
    device: GPUDevice,
    glyph: Glyph,
    camera: Camera,
    format: GPUTextureFormat = "bgra8unorm"
  ) {
    this.ctx = ctx;
    this.device = device;
    this.format = format;

    this.glyph = glyph;
    this.camera = camera;

    // Bind group layout
    this.bindGroupLayout = this.createBindGroupLayout();

    this.ctx.configure({
      device: device,
      format: format,
      alphaMode: "premultiplied",
    });

    // Create uniform buffer
    this.uniformBuffer = this.createUniformBuffer();

    // Create pipeline
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
      // + 16 = 4 * 4; bounding box; glyph length
      size: MAT4LENGTH * 3 + 16 + 16,
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
  createBindGroup(): GPUBindGroup {
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
            buffer: this.glyph.vertexBuffer.buffer,
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

  updateGlyph(){

  }

  updateGraphicsBuffers() {
    const vertexBuffer = this.glyph.vertexBuffer;
    const vertLength = new Float32Array(1);
    vertLength[0] = vertexBuffer.getVertexCount() / 4;
    console.log(vertLength);

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

    // Object attributes
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      <ArrayBuffer>this.glyph.model
    );
    
    // Bounding box
    console.log('Bounding box', vertexBuffer.getBoundingBox());
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      192,
      <ArrayBuffer>vertexBuffer.getBoundingBox()
    );

    // Vertices length
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      208,
      <ArrayBuffer>vertLength
    );

    // Vertices
    this.device.queue.writeBuffer(
      vertexBuffer.buffer,
      0,
      vertexBuffer.vertices.buffer
    );
  }
  // FIXME: 
  // BindGroup je stale ta ista, az kym sa nezmeni text
  render() {
    // Does it need to be here:
    const bindGroup = this.createBindGroup();

    const commandEncoder: GPUCommandEncoder =
      this.device.createCommandEncoder();

    this.updateGraphicsBuffers();
    
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
