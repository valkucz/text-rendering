import "./style.css";
import shader from "./shaders.wgsl";

console.log(navigator.gpu);

const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const ctx: GPUCanvasContext = <GPUCanvasContext>canvas.getContext("webgpu");

var dpr = window.devicePixelRatio || 1;
var rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr * 3;
canvas.height = rect.height * dpr * 3;

const Initialize = async () => {
  const adapter: GPUAdapter = <GPUAdapter>await navigator.gpu?.requestAdapter();
  const device: GPUDevice = <GPUDevice>await adapter?.requestDevice();
  const format: GPUTextureFormat = <GPUTextureFormat>"bgra8unorm";

  ctx.configure({
    device: device,
    format: format,
    alphaMode: "premultiplied",
  });

  const pipeline: GPURenderPipeline = device.createRenderPipeline({
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
};

Initialize();
