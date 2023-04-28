import shader from "../shaders/shaders.wgsl";
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
  bindGroupLayouts: GPUBindGroupLayout[];

  /** Pipeline used for rendering */
  pipeline: GPURenderPipeline;

  /** Buffers */
  buffers: RendererBuffers;

  /** Block of text to render. */
  textBlock: TextBlock;

  /** Camera attribute: projection matrix */
  projectionMatrix: mat4;

  /** Camera attribute: view matrix */
  viewMatrix: mat4;

  /** Color of WebGPU Canvas */
  canvasColor: number[];

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
    this.projectionMatrix = projection;
    this.viewMatrix = view;
    this.canvasColor = color;
    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.buffers = this.createBuffers();
    this.bindGroupLayouts = this.createBindGroupLayouts();
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
      // + 16 = 4 * 4;
      size: MAT4LENGTH * 2 + 16 + this.textBlock.colorBuffer.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const glyphBuffer = this.device.createBuffer({
      size: this.textBlock.verticesSize * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    const transformBuffer = this.device.createBuffer({
      size: this.textBlock.transformsSize * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    return {
      uniform: uniformBuffer,
      glyph: glyphBuffer,
      transforms: transformBuffer,
    };
  }
  /**
   * Creates GPU pipeline.
   * @returns GPU render pipeline
   */
  createPipeline(): GPURenderPipeline {
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: this.bindGroupLayouts,
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
  createBindGroupLayouts(): GPUBindGroupLayout[] {
    return [
      this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {
              type: "uniform",
            },
          },
        ],
      }),
      this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
              type: "storage",
            },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
            buffer: {
              type: "uniform",
            },
          },
        ],
      }),
    ];
  }

  /**
   * Creates bind group that for non-changing rendering data, in this case,
   * uniforms - projection & view matrix, and color.
   * @returns bind group
   */
  createUniformBindGroup(): GPUBindGroup {
    return this.device.createBindGroup({
      layout: this.bindGroupLayouts[0],
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.buffers.uniform,
          },
        },
      ],
    });
  }

  /**
   * Creates bind groups for each glyph.
   * @returns
   */
  createGlyphBindGroups(): GPUBindGroup[] {
    const bindGroups: GPUBindGroup[] = [];
    for (let i = 0; i < this.textBlock.glyphs.length; i++) {
      bindGroups.push(
        this.device.createBindGroup({
          layout: this.bindGroupLayouts[1],
          entries: [
            {
              binding: 0,
              resource: {
                buffer: this.buffers.glyph,
                size: this.textBlock.glyphs[i].verticesSize * 4,
                offset: this.textBlock.glyphs[i].verticesOffset * 4,
              },
            },
            {
              binding: 1,
              resource: {
                buffer: this.buffers.transforms,
                size: this.textBlock.glyphs[i].transformsSize * 4,
                offset: this.textBlock.glyphs[i].transformsOffset * 4,
              },
            },
          ],
        })
      );
    }

    return bindGroups;
  }

  /**
   * Wrties the data to the uniform buffer.
   */
  private setupBuffer() {
    // Camera view matrix
    this.device.queue.writeBuffer(
      this.buffers.uniform,
      0,
      <ArrayBuffer>this.viewMatrix
    );

    // Camera projection matrix
    this.device.queue.writeBuffer(
      this.buffers.uniform,
      64,
      <ArrayBuffer>this.projectionMatrix
    );

    // Filling algorithm
    this.device.queue.writeBuffer(
      this.buffers.uniform,
      128,
      new Float32Array([this.textBlock.isWinding ? 1 : -1]).buffer
    );

    // Color
    this.device.queue.writeBuffer(
      this.buffers.uniform,
      144,
      this.textBlock.colorBuffer
    );

    // Glyph
    this.device.queue.writeBuffer(
      this.buffers.glyph,
      0,
      this.textBlock.verticesBuffer
    );

    this.device.queue.writeBuffer(
      this.buffers.transforms,
      0,
      this.textBlock.transformsBuffer
    );
  }

  /**
   * Prepares data ahead needed for rendering.
   */
  prepare(): PerFrameData {
    this.buffers = this.createBuffers();
    this.setupBuffer();

    const glyphBindGroups = this.createGlyphBindGroups();
    const uniformBindGroup = this.createUniformBindGroup();
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.ctx.getCurrentTexture().createView();

    // commandEncoder.writeTimestamp(querySet, 0);
    // console.log('Renderer: ', this.color);
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: {
            r: this.canvasColor[0],
            g: this.canvasColor[1],
            b: this.canvasColor[2],
            a: this.canvasColor[3],
          },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    return {
      uniformBindGroup,
      glyphBindGroups,
      commandEncoder,
      renderPass
    };
  }

  /**
   * Renders the glyph.
   * @param perFrameData - Data needed for rendering a frame.
   */
  render(perFrameData: PerFrameData) {
    const {
      uniformBindGroup,
      glyphBindGroups,
      commandEncoder,
      renderPass
    } = perFrameData;
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, uniformBindGroup);
    glyphBindGroups.forEach((bindGroup) => {
      renderPass.setBindGroup(1, bindGroup);
      renderPass.draw(6, 1, 0, 0);
    });
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);

  }

}
