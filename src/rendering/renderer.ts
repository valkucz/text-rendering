import shader from "../shaders/shaders.wgsl";
import { Glyph } from "../scene/objects/glyph";
import { PerFrameData } from "./perFrameData";
import { mat4 } from "gl-matrix";
import { RendererBuffers } from "./rendererBuffers";

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

  /** WebGPU canvas */
  canvas: HTMLCanvasElement;

  /** Pipeline used for rendering */
  pipeline: GPURenderPipeline;

  /** Bind group layout used for rendering */
  bindGroupLayout: GPUBindGroupLayout;

  /** Buffers */
  buffers: RendererBuffers;

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
   * @param canvas - WebGPU canvas
   * @param glyph - Glyph to renderer
   * @param projection - Camera attribute: projection matrix
   * @param view - Camera attribute: view matrix
   * @param format - Format of the canvas
   * @default "bgra8unorm"
   * @public
   */
  constructor(
    device: GPUDevice,
    canvas: HTMLCanvasElement,
    glyph: Glyph,
    projection: mat4,
    view: mat4,
    format: GPUTextureFormat = "bgra8unorm"
  ) {
    this.device = device;
    this.canvas = canvas;
    this.ctx = <GPUCanvasContext>canvas.getContext("webgpu");
    if (!this.ctx) {
      throw new Error("Context is null or undefined");
    }    
    this.glyph = glyph;
    this.projection = projection;
    this.view = view;
    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.bindGroupLayout = this.createBindGroupLayout();
    this.buffers = this.createBuffers();
    this.pipeline = this.createPipeline();

    this.ctx.configure({
      device: device,
      format: format,
      alphaMode: "premultiplied",
    });
  }

  /**
   * Creates buffers.
   * @returns buffers
   */
  createBuffers(): RendererBuffers {
    const uniformBuffer = this.device.createBuffer({
      // + 16 = 4 * 4; bounding box; glyph length
      size: MAT4LENGTH * 3,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const canvasBuffer = this.device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bbBuffer = this.device.createBuffer({
      size: 16 * 3,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    return {
      uniform: uniformBuffer,
      canvas: canvasBuffer,
      bb: bbBuffer,
    };
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
      multisample: {
        count: 1,
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
        {
          binding: 3,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 4,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
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
            buffer: this.buffers.uniform,
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
        {
          binding: 3,
          resource: {
            buffer: this.buffers.canvas,
          },
        },
        {
          binding: 4,
          resource: {
            buffer: this.buffers.bb,
          },
        },
      ],
    });
  }

  /**
   * Wrties the data to the uniform buffer.
   */
  private setupBuffer() {
    // Camera projection matrix
    this.device.queue.writeBuffer(
      this.buffers.uniform,
      128,
      <ArrayBuffer>this.projection
    );

    // Camera view matrix
    this.device.queue.writeBuffer(
      this.buffers.uniform,
      64,
      <ArrayBuffer>this.view
    );

    // Glyph model matrix
    this.device.queue.writeBuffer(
      this.buffers.uniform,
      0,
      <ArrayBuffer>this.glyph.model
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

    // Canvas 
    this.device.queue.writeBuffer(
      this.buffers.canvas,
      0,
      <ArrayBuffer>(new Float32Array([this.canvas.width, this.canvas.height]))
    );
    console.log('canvas', this.canvas.width, this.canvas.height);

    // Bounding box
    this.device.queue.writeBuffer(
      this.buffers.bb,
      0,
      <ArrayBuffer>this.glyph.vertexBuffer.getBoundingBox()
    );
    console.log('bb', this.glyph.vertexBuffer.getBoundingBox());

    // Bounding box of font coordinate system
    this.device.queue.writeBuffer(
      this.buffers.bb,
      16,
      <ArrayBuffer>new Float32Array(this.glyph.fontParser.getBb())
    );

    // Vertices length
    this.device.queue.writeBuffer(
      this.buffers.bb,
      32,
      <ArrayBuffer>(
        new Float32Array([this.glyph.vertexBuffer.getVertexCount() / 2])
      )
    );
  }

  /**
   * Prepares data ahead needed for rendering.
   */
  prepare(): PerFrameData {
      // FIXME: temporary, writeTimestamp
      const capacity = 3;//Max number of timestamps we can store
      const querySet = this.device.createQuerySet({
        // If timestampWrites is not empty, "timestamp-query" must be enabled for device.
        type: "timestamp",
        count: capacity,
      });
  
      const queryBuffer = this.device.createBuffer({
        size: 8 * capacity,
        usage: GPUBufferUsage.QUERY_RESOLVE 
          | GPUBufferUsage.STORAGE
          | GPUBufferUsage.COPY_SRC
          | GPUBufferUsage.COPY_DST,
      });
      
    // FIXME: for multisampling
    const renderTarget = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      sampleCount: 4,
      format: this.format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const renderTargetView = renderTarget.createView();

    this.setupBuffer();
    const bindGroup = this.createBindGroup();
    const commandEncoder = this.device.createCommandEncoder();

    const textureView = this.ctx.getCurrentTexture().createView();

    commandEncoder.writeTimestamp(querySet, 0);
    
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          // resolveTarget: renderTargetView,
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
      querySet,
      queryBuffer,
    };
  }

  /**
   * Renders the glyph.
   * @param perFrameData - Data needed for rendering a frame.
   */
  render(perFrameData: PerFrameData) {
    
    const { bindGroup, commandEncoder, renderPass, querySet, queryBuffer } = perFrameData;
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, bindGroup);
    
    // FIXME: temporary, writeTimestamp
      
    renderPass.draw(6, 1, 0, 0);
    
    
    renderPass.end();
    
    commandEncoder.writeTimestamp(querySet, 1);
    // FIXME: remove submit
    this.device.queue.submit([commandEncoder.finish()]);

    // capacity = 3
    commandEncoder.resolveQuerySet(querySet, 0, 3, queryBuffer, 0);
    // Read timestamp results after finishing the command encoder.
    this.readBuffer(queryBuffer).then(res => {
      console.log('Read buffer timestamp', res);
    })
  }

  // from  https://omar-shehata.medium.com/how-to-use-webgpu-timestamp-query-9bf81fb5344a
  async readBuffer(buffer: GPUBuffer) {
    const size = buffer.size;
    const gpuReadBuffer = this.device.createBuffer({size, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const copyEncoder = this.device.createCommandEncoder();
    copyEncoder.copyBufferToBuffer(buffer, 0, gpuReadBuffer, 0, size);
    const copyCommands = copyEncoder.finish();
    this.device.queue.submit([copyCommands]);
    await gpuReadBuffer.mapAsync(GPUMapMode.READ);
    return gpuReadBuffer.getMappedRange();
  }
}
