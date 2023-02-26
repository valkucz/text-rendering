import { vec3 } from "gl-matrix";
import "./style.css";
import { Renderer } from "./rendering/renderer";
import { Square } from "./scene/objects/square";
import { Camera } from "./scene/camera";
import { mapKeyToMoveDirection } from "./scene/moveDirection";

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

// TODO: remove export
export const conversionFactor = vec3.fromValues(canvas.width, canvas.height, 1);
export const segments: number = 20;

const controlPoints1: vec3[] = [
  vec3.fromValues(197, 395, 0),
  vec3.fromValues(399, 120, 0),
  vec3.fromValues(635, 388, 0),
];
const controlPoints2: vec3[] = [
  vec3.fromValues(197, 395, 0),
  vec3.fromValues(399, 120, 0),
  vec3.fromValues(450, 388, 0),
];

const renderer = await initializeWebGPU();
if (renderer) {
  
  const object = new Square(renderer.device);
  renderer.render([object]);

  document.addEventListener("keydown", (event) => {
    console.log(event.key);
    renderer.camera.move(mapKeyToMoveDirection(event.key));
    renderer.camera.updateView();
    renderer.render([object]);
  })
}
