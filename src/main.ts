// import { ButtonController, CanvasController2D, PointsController, SliderController } from "./controllers";
import "./style.css";
// import { initialize } from "./rendering/renderer";

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

// await initialize(ctx);


// WHEN CTX 2D:

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

