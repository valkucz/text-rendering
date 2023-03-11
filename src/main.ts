import { vec2 } from "gl-matrix";
import "./style.css";
import { Renderer } from "./rendering/renderer";
import { Camera } from "./scene/camera";
import { mapKeyToMoveDirection } from "./scene/moveDirection";
import { parseText } from "./fonts";
import { Glyph } from "./scene/objects/glyph";

/**
 * Initialization of WebGPU device, adapter.
 * @param vertices
 * @returns renderer if no error occured
 */
async function initializeWebGPU(): Promise<Renderer | void> {
  console.log(navigator.gpu);
  if (!("gpu" in navigator)) {
    console.error("User agent doesn’t support WebGPU.");
    return;
  }

  // create adapter
  const adapter: GPUAdapter = <GPUAdapter>await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error("No WebGPU adapters found.");
    return;
  }

  // create device
  const device: GPUDevice = <GPUDevice>await adapter.requestDevice();

  // create camera
  const camera: Camera = new Camera();

  return new Renderer(ctx, device, camera);
}

// set canvas
const canvas = <HTMLCanvasElement>document.getElementById("canvas");
const ctx: GPUCanvasContext = <GPUCanvasContext>canvas.getContext("webgpu");
// const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Context is null or undefined");
}

var dpr = window.devicePixelRatio || 1;
var rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr * 3;
canvas.height = rect.height * dpr * 3;

console.log('Canvas size', canvas.width, canvas.height);
// TODO: remove export
export const conversionFactor = vec2.fromValues(canvas.width, canvas.height);
export const segments: number = 15;

const renderer = await initializeWebGPU();

if (renderer) {
  
  const vertices = await parseText('guľôčka');
  const glyph = new Glyph(renderer.device, vertices);
  
  console.log('Glyph vertices: ', glyph.vertices);
  console.log('Vertices: ', vertices);

  renderer.render(glyph);

  document.addEventListener("keydown", (event) => {
    console.log(event.key);
    renderer.camera.move(mapKeyToMoveDirection(event.key));
    renderer.camera.updateView();
    renderer.render(glyph);
  })
}
