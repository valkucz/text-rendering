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

const OFFSET = 256;

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
      size: MAT4LENGTH * 2,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // const canvasBuffer = this.device.createBuffer({
    //   size: 16,
    //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    // });

    // const bbBuffer = this.device.createBuffer({
    //   size: 16 * 3,
    //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    // });

    const alignment = this.device.limits.minStorageBufferOffsetAlignment;
    const size = Math.ceil((this.textBlock.size )/ alignment) * alignment;
    console.log('Buffer size: ', this.textBlock.size * 4);
    const glyphBuffer = this.device.createBuffer({
      size: this.textBlock.size * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
    return {
      uniform: uniformBuffer,
      glyph: glyphBuffer,
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
        {
          // TODO: change to uniform
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: "storage",
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
        }]
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
        {
          binding: 1,
          resource: {
            buffer: this.textBlock.colorBuffer.buffer,
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
    const alignment = this.device.limits.minStorageBufferOffsetAlignment;
    
    for (let i = 0; i < this.textBlock.glyphs.length; i++) {
      console.log('Bind groups, offsets', Math.ceil(this.textBlock.glyphs[i].offset / alignment) * alignment);
      bindGroups.push(this.device.createBindGroup({
        layout: this.bindGroupLayouts[1],
        entries: [
          {
            binding: 0,
            resource: {
              buffer: this.buffers.glyph,
              size: this.textBlock.glyphs[i].size * 4,
              offset: this.textBlock.glyphs[i].offset * 4
            },
          },
        ],
      }))
    }
    
    return bindGroups;
  }


  /**
   * Wrties the data to the uniform buffer.
   */
  private setupBuffer() {
    // Camera projection matrix
    this.device.queue.writeBuffer(
      this.buffers.uniform,
      64,
      <ArrayBuffer>this.projection
    );

    // Camera view matrix
    this.device.queue.writeBuffer(
      this.buffers.uniform,
      0,
      <ArrayBuffer>this.view
    );

    // Color
    this.device.queue.writeBuffer(
      this.textBlock.colorBuffer.buffer,
      0,
      this.textBlock.colorBuffer.vertices.buffer
    );

    // Glyph
    const glyphBuffer = this.textBlock.getBuffer();
    this.device.queue.writeBuffer(
      this.buffers.glyph,
      0,
      glyphBuffer
    );
    
    console.log('Glyph buffer,', glyphBuffer);

    // Canvas 
    // this.device.queue.writeBuffer(
    //   this.buffers.canvas,
    //   0,
    //   <ArrayBuffer>(new Float32Array([this.canvas.width, this.canvas.height]))
    // );
    // console.log('canvas', this.canvas.width, this.canvas.height);



    // Bounding box of font coordinate system
    // this.device.queue.writeBuffer(
    //   this.buffers.bb,
    //   16,
    //   <ArrayBuffer>new Float32Array(this.textBlock.fontParser.getBb())
    // );

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
    // const glyphBuffers = this.setupGlyphBuffers();

    // const { bindGroups, buffers } = this.setupGlyphBuffers();
    const glyphBindGroups = this.createGlyphBindGroups();
    const uniformBindGroup = this.createUniformBindGroup();
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.ctx.getCurrentTexture().createView();
    // console.log('Renderer: ', this.color);
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
    const { uniformBindGroup, glyphBindGroups, commandEncoder, renderPass } = perFrameData;
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, uniformBindGroup);
    glyphBindGroups.forEach((bindGroup, i) => {
      console.log('bind group', bindGroup);
      // Vertices
      // this.device.queue.writeBuffer(
      //   buffers[i],
      //   0,
      //   this.textBlock.glyphs[i].vertices.buffer
      // );
      // renderPass.
      // renderPass.setVertexBuffer(0, buffers[i]);
      renderPass.setBindGroup(1, bindGroup);
      renderPass.draw(6, 1, 0, 0);
    });
    renderPass.end();
    
    this.device.queue.submit([commandEncoder.finish()]);
  }
}
