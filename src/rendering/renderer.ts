import shader from "../shaders/shaders.wgsl";
import { Glyph } from "../scene/objects/glyph";
import { PerFrameData } from "./perFrameData";
import { mat4 } from "gl-matrix";

/** Length of the matrix in bytes
 * the matrix is 4x4 and each element is 4 bytes => 4 * 4 * 4 = 64
 */
const MAT4LENGTH = 64;

/**
 * Represents a GPU Renderer that is responsible for rendering objects
 * on the WebGPU canvas using specified context and device.
 * @public
 */
export class Renderer {
  /** GPU device used for rendering */
  device: GPUDevice;

  /** Canvas context used for rendering */
  ctx: GPUCanvasContext;

  /** Pipeline used for rendering */
  pipeline: GPURenderPipeline;

  /** Bind group layout used for rendering */
  bindGroupLayout: GPUBindGroupLayout;

  /** Uniform buffer used for rendering */
  uniformBuffer: GPUBuffer;

  /** Glyph to renderer */
  glyph: Glyph;

  /** Camera attribute: projection matrix */
  projection: mat4;

  /** Camera attribute: view matrix */
  view: mat4;

  /** Format of the canvas
   * @default "bgra8unorm"
   */
  format: GPUTextureFormat;

  /**
   * Creates a new Renderer instance.
   * @param device - GPU device used for rendering
   * @param ctx - Canvas context used for rendering
   * @param glyph - Glyph to renderer
   * @param projection - Camera attribute: projection matrix
   * @param view - Camera attribute: view matrix
   * @param format - Format of the canvas
   * @default "bgra8unorm"
   * @public
   */
  constructor(
    device: GPUDevice,
    ctx: GPUCanvasContext,
    glyph: Glyph,
    projection: mat4,
    view: mat4,
    format: GPUTextureFormat = "bgra8unorm"
  ) {
    this.device = device;
    this.ctx = ctx;
    this.glyph = glyph;
    this.projection = projection;
    this.view = view;
    this.format = format;

    this.bindGroupLayout = this.createBindGroupLayout();
    this.uniformBuffer = this.createUniformBuffer();
    this.pipeline = this.createPipeline();

    this.ctx.configure({
      device: device,
      format: format,
      alphaMode: "premultiplied",
    });
  }

  /**
   * Creates GPU pipeline.
   * @returns GPU render pipeline
   */
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

  /**
   * Creates bind group layout that specifies how to resources are bound to the pipeline.
   * Basis for bind group.
   * @returns bind group layout
   */
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
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "storage",
          },
        },
      ],
    });
  }

  /**
   * Creates bind group that provides concrete resource bindings for a pipeline.
   * @returns bind group
   */
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
        },
        {
          binding: 2,
          resource: {
            buffer: this.glyph.colorBuffer.buffer,
          },
        },
      ],
    });
  }

  /**
   * Creates uniform buffer that is used to pass data to the shader.
   * @returns uniform buffer
   */
  createUniformBuffer(): GPUBuffer {
    return this.device.createBuffer({
      // + 16 = 4 * 4; bounding box; glyph length
      size: MAT4LENGTH * 3 + 16 + 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  /**
   * Wrties the data to the uniform buffer.
   */
  private setupBuffer() {
    // Camera projection matrix
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      128,
      <ArrayBuffer>this.projection
    );

    // Camera view matrix
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      64,
      <ArrayBuffer>this.view
    );

    // Glyph model matrix
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      <ArrayBuffer>this.glyph.model
    );

    // Bounding box
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      192,
      <ArrayBuffer>this.glyph.vertexBuffer.getBoundingBox()
    );

    // Vertices length
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      208,
      <ArrayBuffer>(
        new Float32Array([this.glyph.vertexBuffer.getVertexCount() / 4])
      )
    );

    // Vertices
    this.device.queue.writeBuffer(
      this.glyph.vertexBuffer.buffer,
      0,
      this.glyph.vertexBuffer.vertices.buffer
    );

    // Color
    this.device.queue.writeBuffer(
      this.glyph.colorBuffer.buffer,
      0,
      this.glyph.colorBuffer.vertices.buffer
    );
  }

  /**
   * Prepares data ahead needed for rendering.
   */
  prepare(): PerFrameData {
    this.setupBuffer();
    const bindGroup = this.createBindGroup();
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.ctx.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    return {
      bindGroup,
      commandEncoder,
      renderPass,
    };
  }

  /**
   * Renders the glyph.
   * @param perFrameData - Data needed for rendering a frame.
   */
  render(perFrameData: PerFrameData) {
    const { bindGroup, commandEncoder, renderPass } = perFrameData;
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, bindGroup);
    renderPass.draw(6, 1, 0, 0);
    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }
}
