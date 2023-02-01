import shader from "../../shaders/shaders.wgsl";

/**
 * Initialization of WebGPU device, adapter.
 * @param ctx
 * @returns true if no error occured
 */
export async function initialize(ctx: GPUCanvasContext): Promise<boolean> {
 console.log(navigator.gpu);
  if (!("gpu" in navigator)) {
    console.error("User agent doesn’t support WebGPU.");
    return false;
  }

  // create adapter
  const adapter: GPUAdapter = <GPUAdapter>await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error("No WebGPU adapters found.");
    return false;
  }

  // create device
  const device: GPUDevice = <GPUDevice>await adapter.requestDevice();

  // texture format
  const format: GPUTextureFormat = <GPUTextureFormat>"bgra8unorm";

  ctx.configure({
    device: device,
    format: format,
    alphaMode: "premultiplied",
  });

  // create pipeline
  const pipeline = createPipeline(device, format);

  //render
  render(device, ctx, pipeline);

  return true;
}

/**
 *
 * @param device
 * @param format
 */
function createPipeline(
  device: GPUDevice,
  format: GPUTextureFormat
): GPURenderPipeline {
  return device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: shader,
      }),
      entryPoint: "vs_main",
    },
    fragment: {
      module: device.createShaderModule({
        code: shader,
      }),
      entryPoint: "fs_main",
      targets: [
        {
          format: format,
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
    layout: "auto",
  });
}

function render(
  device: GPUDevice,
  ctx: GPUCanvasContext,
  pipeline: GPURenderPipeline
) {
  const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();
  const textureView: GPUTextureView = ctx.getCurrentTexture().createView();
  const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [
      {
        view: textureView,
        clearValue: { r: 0.5, g: 0.0, b: 0.25, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });
  renderpass.setPipeline(pipeline);
  renderpass.draw(3, 1, 0, 0);
  renderpass.end();

  device.queue.submit([commandEncoder.finish()]);
}
