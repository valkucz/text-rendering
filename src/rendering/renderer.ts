import shader from "../shaders/shaders.wgsl";
import { Glyph } from "../scene/objects/glyph";
import { PerFrameData } from "./perFrameData";
import { mat4 } from "gl-matrix";
import { RendererBuffers } from "./rendererBuffers";
import { TextBlock } from "../scene/objects/textBlock";

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

  /** Bind group layout */
  bindGroupLayout: GPUBindGroupLayout;

  /** Pipeline used for rendering */
  pipeline: GPURenderPipeline;

  /** Buffers */
  buffers: RendererBuffers;

  /** Block of text to render. */
  textBlock: TextBlock;

  /** Camera attribute: projection matrix */
  projection: mat4;

  /** Camera attribute: view matrix */
  view: mat4;

  /** Color of WebGPU Canvas */
  color: number[];

  /** Format of the canvas
   * @default "bgra8unorm"
   */
  format: GPUTextureFormat;

  /**
   * Creates a new Renderer instance.
   * @param device - GPU device used for rendering
   * @param canvas - WebGPU canvas
   * @param textBlock - BLock of text to render
   * @param projection - Camera attribute: projection matrix
   * @param view - Camera attribute: view matrix
   * @param format - Format of the canvas
   * @default "bgra8unorm"
   * @public
   */
  constructor(
    device: GPUDevice,
    canvas: HTMLCanvasElement,
    textBlock: TextBlock,
    projection: mat4,
    view: mat4,
    // TODO: set to default? 
    color: number[],
    format: GPUTextureFormat = "bgra8unorm"
  ) {
    this.device = device;
    this.canvas = canvas;
    this.ctx = <GPUCanvasContext>canvas.getContext("webgpu");
    if (!this.ctx) {
      throw new Error("Context is null or undefined");
    }    
    this.textBlock = textBlock;
    this.projection = projection;
    this.view = view;
    this.color = color;
    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.buffers = this.createBuffers();
    this.bindGroupLayout = this.createBindGroupLayout();
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
  createBindGroup(vertexBuffer: GPUBuffer): GPUBindGroup {
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
            buffer: vertexBuffer,
          },
        },
        {
          binding: 2,
          resource: {
            buffer: this.textBlock.colorBuffer.buffer,
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

    // Color
    this.device.queue.writeBuffer(
      this.textBlock.colorBuffer.buffer,
      0,
      this.textBlock.colorBuffer.vertices.buffer
    );

    // Canvas 
    this.device.queue.writeBuffer(
      this.buffers.canvas,
      0,
      <ArrayBuffer>(new Float32Array([this.canvas.width, this.canvas.height]))
    );
    console.log('canvas', this.canvas.width, this.canvas.height);



    // Bounding box of font coordinate system
    this.device.queue.writeBuffer(
      this.buffers.bb,
      16,
      <ArrayBuffer>new Float32Array(this.textBlock.fontParser.getBb())
    );

  }

  private setupGlyphBuffers(): GPUBindGroup[] {
    const bindGroups: GPUBindGroup[] = [];

    this.textBlock.glyphs.forEach((glyph) => {
      // Vertex buffer
      // let vertexBuffer = ;
      // vertexBuffer.unmap();
      let vertexBuffer = this.device.createBuffer({
        size: glyph.vertices.byteLength * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        mappedAtCreation: false,
      });

      bindGroups.push(this.createBindGroup(vertexBuffer));

      // Vertices
      this.device.queue.writeBuffer(
        vertexBuffer,
        0,
        glyph.vertices.buffer
      );

      // Glyph model matrix
      this.device.queue.writeBuffer(
        this.buffers.uniform,
        0,
        <ArrayBuffer>glyph.model
      );

      // Vertices length
      // TODO: Or add it to vertexBuffer?
      this.device.queue.writeBuffer(
        this.buffers.bb,
        32,
        <ArrayBuffer>(
          new Float32Array([glyph.vertices.length / 2])
        )
      );

      // Glyph Bounding box
      this.device.queue.writeBuffer(
        this.buffers.bb,
        0,
        <ArrayBuffer>glyph.bb
      );

    });
    return bindGroups;
  }

  /**
   * Prepares data ahead needed for rendering.
   */
  prepare(): PerFrameData {
    // const renderTarget = this.device.createTexture({
    //   size: [this.canvas.width, this.canvas.height],
    //   sampleCount: 4,
    //   format: this.format,
    //   usage: GPUTextureUsage.RENDER_ATTACHMENT,
    // });
    // const renderTargetView = renderTarget.createView();
    this.setupBuffer();
    const glyphBuffers = this.setupGlyphBuffers();

    const bindGroups = this.setupGlyphBuffers();
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.ctx.getCurrentTexture().createView();
    console.log('Renderer: ', this.color);
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: this.color[0], g: this.color[1], b: this.color[2], a: this.color[3]},
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    return {
      bindGroups,
      commandEncoder,
      renderPass
    };
  }

  /**
   * Renders the glyph.
   * @param perFrameData - Data needed for rendering a frame.
   */
  render(perFrameData: PerFrameData) {
    // kaslat na groups, zoznam bindgroups....
    const { bindGroups, commandEncoder, renderPass } = perFrameData;
    renderPass.setPipeline(this.pipeline);
    bindGroups.forEach((bindGroup) => {
      renderPass.setBindGroup(0, bindGroup);
      renderPass.draw(6, 1, 0, 0);
    });
    
    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }
}
