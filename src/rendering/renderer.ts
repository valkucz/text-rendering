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
    const glyphBuffer = this.device.createBuffer({
      size: this.textBlock.verticesSize * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
    const transformBuffer = this.device.createBuffer({
      size: this.textBlock.transformsSize * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

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
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
          },
        },
      ]
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
    for (let i = 0; i < this.textBlock.glyphs.length; i++) {
      bindGroups.push(this.device.createBindGroup({
        layout: this.bindGroupLayouts[1],
        entries: [
          {
            binding: 0,
            resource: {
              buffer: this.buffers.glyph,
              size: this.textBlock.glyphs[i].verticesSize * 4,
              offset: this.textBlock.glyphs[i].verticesOffset * 4
            },
          },
          {
            binding: 1,
            resource: {
              buffer: this.buffers.transforms,
              size: this.textBlock.glyphs[i].transformsSize * 4,
              offset: this.textBlock.glyphs[i].transformsOffset * 4
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
    // const renderTarget = this.device.createTexture({
    //   size: [this.canvas.width, this.canvas.height],
    //   sampleCount: 4,
    //   format: this.format,
    //   usage: GPUTextureUsage.RENDER_ATTACHMENT,
    // });
    // const renderTargetView = renderTarget.createView();
    this.buffers = this.createBuffers();
    this.setupBuffer();
    // const glyphBuffers = this.setupGlyphBuffers();

    // const { bindGroups, buffers } = this.setupGlyphBuffers();
    const glyphBindGroups = this.createGlyphBindGroups();
    const uniformBindGroup = this.createUniformBindGroup();
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.ctx.getCurrentTexture().createView();

    commandEncoder.writeTimestamp(querySet, 0);
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
    const { uniformBindGroup, glyphBindGroups, commandEncoder, renderPass, querySet, queryBuffer } = perFrameData;
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, uniformBindGroup);
    glyphBindGroups.forEach((bindGroup) => {
      renderPass.setBindGroup(1, bindGroup);
      renderPass.draw(6, 1, 0, 0);
    });
    renderPass.end();
    
    commandEncoder.writeTimestamp(querySet, 1);
    commandEncoder.resolveQuerySet(querySet, 0, 3, queryBuffer, 0);
    // this.readBuffer(queryBuffer).then(res => {
    //   console.log('Read buffer timestamp', res);
    // })
    this.device.queue.submit([commandEncoder.finish()]);

    this.readBuffer(queryBuffer).then(res => {
      console.log('Read buffer timestamp', res);
      const timingsNanoseconds = new BigInt64Array(res);
      console.log('Time: ', timingsNanoseconds[1] - timingsNanoseconds[0]);
      return res;
    });
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
