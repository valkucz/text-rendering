import { Point, getCanvasPoint, drawBezier } from "./draw";
export class PointsController {
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

export class SliderController {
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

export class ButtonController {
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
    canvasController: CanvasController2D,
    sliderController: SliderController,
  ) {
    this.draw.addEventListener("click", () => {
      drawBezier(
        pointsController.points,
        sliderController.getSegments(),
        canvasController.ctx
      );
      pointsController.clear();
    });
    this.delete.addEventListener("click", () =>
      canvasController.clear(pointsController, this)
    );
  }
}


export class CanvasController2D {
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    pointsController.clear();
    // buttonController.changeDisability();
  }

  addEventListener(pointsController: PointsController) {
    this.canvas.addEventListener("mousedown", (e) => {
      if (this.canvas.style.cursor !== "not-allowed") {
        let point = getCanvasPoint(e, this.canvas);
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



// parse text here
// parseText(canvasController.ctx);