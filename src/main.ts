import './style.css'
import { Point, drawBezier, getCanvasPoint, drawLines } from './draw'
import shader from "./shaders.wgsl";
// import wgsl from 'vite-plugin-glsl';
class PointsController{
import "./style.css";
import { Point, drawBezier, getCanvasPoint, fill } from "./draw";
import { parseText } from "./fonts";

class PointsController {
  points: Point[] = [];
  pointsDisplay: HTMLElement;
  constructor(pointsDisplay: HTMLElement) {
    this.pointsDisplay = pointsDisplay;
  }

  addPoint(point: Point) {
    this.points.push(point);
    this.updateDisplayedPoints();
  }
  updateDisplayedPoints() {
    this.pointsDisplay.innerHTML = this.points.length.toString();
  }
  clear() {
    this.points = [];
    this.updateDisplayedPoints();
  }
  isEmpty() {
    return this.points.length == 0;
  }
}

class SliderController {
  slider: HTMLElement;
  sliderValueDisplay: HTMLElement;
  constructor(slider: HTMLElement, sliderValueDisplay: HTMLElement) {
    this.slider = slider;
    this.sliderValueDisplay = sliderValueDisplay;

    this.updateDisplayValue();
  }
  updateDisplayValue() {
    // FIX: ts error
    this.sliderValueDisplay.innerHTML = this.slider.value;
  }
  getSegments() {
    return Number(this.sliderValueDisplay.innerHTML);
  }
  addEventListener() {
    this.slider.addEventListener("input", () => this.updateDisplayValue());
  }
}

class ButtonController {
  draw: HTMLButtonElement;
  delete: HTMLButtonElement;

  constructor(draw: HTMLButtonElement, deleteBtn: HTMLButtonElement) {
    this.draw = draw;
    this.delete = deleteBtn;

    // this.changeDisability();
  }
  changeDisability() {
    this.draw.disabled = !this.draw.disabled;
  }
  addEventListener(
    pointsController: PointsController,
    canvasController: CanvasController,
    sliderController: SliderController
  ) {
    drawBtn.addEventListener("click", () => {
      drawBezier(
        pointsController.points,
        sliderController.getSegments(),
        canvasController.ctx
      );
      pointsController.clear();
    });
    deleteBtn.addEventListener("click", () =>
      canvasController.clear(pointsController, this)
    );
  }
}

class CanvasController {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    // Get the device pixel ratio, falling back to 1.
    var dpr = window.devicePixelRatio || 1;
    // Get the size of the canvas in CSS pixels.
    var rect = this.canvas.getBoundingClientRect();
    // Give the canvas pixel dimensions of their CSS
    // size * the device pixel ratio.
    this.canvas.width = rect.width * dpr * 3;
    this.canvas.height = rect.height * dpr * 3;
    // this.ctx.scale(1, -1);
    this.ctx.strokeStyle = "black";
    this.canvas.style.cursor = "crosshair";
  }
  clear(
    pointsController: PointsController,
    buttonController: ButtonController
  ) {
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    pointsController.clear();
    // buttonController.changeDisability();
  }

  addEventListener(pointsController: PointsController) {
    this.canvas.addEventListener("mousedown", (e) => {
      if (canvas.style.cursor !== "not-allowed") {
        let point = getCanvasPoint(e, canvas);
        console.log(point);
        if (pointsController.isEmpty()) {
          this.ctx.beginPath();
          this.ctx.moveTo(point.x, point.y);
          // buttonController.changeDisability();
        } else {
          this.ctx.lineTo(point.x, point.y);
          this.ctx.stroke();
        }
        this.ctx.fillRect(point.x, point.y, 5, 5);
        pointsController.addPoint(point);
      }
    });
  }
}

// create canvas controller
var canvas = <HTMLCanvasElement>document.getElementById("canvas");
var ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("Context is null or undefined");
}
let canvasController = new CanvasController(canvas, ctx);

// create points controller
let pointsDisplay = document.getElementById("pointsValue");
if (!pointsDisplay) {
  throw new Error("pointsDisplay is null or undefined");
}
let pointsController = new PointsController(pointsDisplay);

// create slider controller
let slider = document.getElementById("slider");
if (!slider) {
  throw new Error("Slider is null or undefined");
}

let sliderValue = document.getElementById("sliderValue");
if (!sliderValue) {
  throw new Error("sliderValue is null or undefined");
}

let sliderController = new SliderController(slider, sliderValue);

// create button controller
let drawBtn = <HTMLButtonElement>document.getElementById("drawBtn");
let deleteBtn = <HTMLButtonElement>document.getElementById("deleteBtn");
if (!drawBtn || !deleteBtn) {
  throw new Error("");
}

let buttonController = new ButtonController(drawBtn, deleteBtn);

// event listeners here
sliderController.addEventListener();
buttonController.addEventListener(
  pointsController,
  canvasController,
  sliderController
);
canvasController.addEventListener(pointsController);

// parse text here
// parseText(canvasController.ctx);

console.log(navigator.gpu);

const Initialize = async() => {
  const adapter : GPUAdapter = <GPUAdapter> await navigator.gpu?.requestAdapter();
  const device : GPUDevice = <GPUDevice> await adapter?.requestDevice();
  const format : GPUTextureFormat = <GPUTextureFormat> "bgra8unorm";

  ctx.configure({
    device: device,
    format: format,
    alphaMode: "premultiplied"
  });

  const pipeline: GPURenderPipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: shader
      }),
      entryPoint: "vs_main"
    },
    fragment: {
      module: device.createShaderModule({
        code: shader
      }),
      entryPoint: "fs_main",
      targets: [{
        format: format
      }]
    },
    primitive: {
      topology: "triangle-list"
    },
    layout: "auto"
  });

  const commandEncoder: GPUCommandEncoder = device.createCommandEncoder();
  const textureView: GPUTextureView = ctx.getCurrentTexture().createView();
  const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: textureView,
      clearValue: {r: 0.5, g: 0.0, b: 0.25, a: 1.0},
      loadOp: "clear",
      storeOp: "store"
    }]
  })
  renderpass.setPipeline(pipeline);
  renderpass.draw(3, 1, 0, 0);
  renderpass.end();

  device.queue.submit([commandEncoder.finish()]);
}
function testSdBezierLine(ctx: CanvasRenderingContext2D) {
  let min = new Point(176, 276);
  let max = new Point(647, 401);
  // control points of quadratic bezier
  let points = [new Point(197, 395), new Point(399, 120), new Point(635, 388)];

  fill(min, max, points, ctx);
  drawBezier(points, 17, ctx);
}

function testSdBezierLetter() {
  parseText(canvasController.ctx, "i");
}
// testSdBezierLine(canvasController.ctx);
testSdBezierLetter();

Initialize();