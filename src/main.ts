import { vec2 } from "gl-matrix";
// import { ButtonController, CanvasController2D, PointsController, SliderController } from "./controllers";
// import { drawBezier, fill } from "./draw";
// import { parseText } from "./fonts";
import "./style.css";
import { Renderer, Vertices } from "./rendering/renderer";
import { Curve } from "./curve";
import { parseText } from "./fonts";
import { Glyph } from "./glyph";


/**
 * Initialization of WebGPU device, adapter.
 * @param vertices
 * @returns renderer if no error occured
 */
async function initializeWebGPU(vertices: vec2[]): Promise<Renderer|void> {
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

  const curveBuffer = new Curve(device, vertices);

  return new Renderer(ctx, device, curveBuffer);
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

export const conversionFactor = vec2.fromValues(canvas.width, canvas.height);
export const segments: number = 20;

const controlPoints1: vec2[] = [
  vec2.fromValues(197, 395),
  vec2.fromValues(399, 120),
  vec2.fromValues(635, 388),
];
const controlPoints2: vec2[] = [
  vec2.fromValues(197, 395),
  vec2.fromValues(399, 120),
  vec2.fromValues(450, 388),
];

const renderer = await initializeWebGPU([]);

if (renderer) {

  renderer.render(controlPoints1);
}


// CTX 2D:

// let drawBtn = <HTMLButtonElement>document.getElementById("drawBtn");
// let deleteBtn = <HTMLButtonElement>document.getElementById("deleteBtn");
// if (!drawBtn || !deleteBtn) {
//   throw new Error("");
// }
// // create slider controller
// let slider = document.getElementById("slider");
// if (!slider) {
//   throw new Error("Slider is null or undefined");
// }

// let sliderValue = document.getElementById("sliderValue");
// if (!sliderValue) {
//   throw new Error("sliderValue is null or undefined");
// }
// // create points controller
// let pointsDisplay = document.getElementById("pointsValue");
// if (!pointsDisplay) {
//   throw new Error("pointsDisplay is null or undefined");
// }

// let canvasController2D = new CanvasController2D(canvas, ctx);

// let pointsController = new PointsController(pointsDisplay);

// let sliderController = new SliderController(slider, sliderValue);

// let buttonController = new ButtonController(drawBtn, deleteBtn);

// sliderController.addEventListener();
// buttonController.addEventListener(
//   pointsController,
//   canvasController2D,
//   sliderController
// );
// canvasController2D.addEventListener(pointsController);

// function testSdBezierLine(ctx: CanvasRenderingContext2D) {
//     let min = vec2.fromValues(176, 276);
//     let max = vec2.fromValues(647, 401);
//     // control points of quadratic bezier
//     let points = [vec2.fromValues(197, 395), vec2.fromValues(399, 120), vec2.fromValues(635, 388)];

//     fill(min, max, points, ctx);
//     drawBezier(points, 17, ctx);
//   }

//   function testSdBezierLetter() {
//     parseText(canvasController2D.ctx, "a");
//   }
//   // testSdBezierLine(canvasController.ctx);
//   testSdBezierLetter();
