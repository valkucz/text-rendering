import { vec2 } from "gl-matrix";
import { solveDeCasteljau } from "./bezier";
import { sdBezier } from "./distanceFunctions";
import { isInsideGlyph } from "./winding";

export function getCanvasPoint(e: MouseEvent, canvas: HTMLCanvasElement) {
  let rect = canvas.getBoundingClientRect();
  const res = vec2.fromValues(Math.ceil(
    ((e.clientX - rect.left) / (rect.right - rect.left)) * canvas.width
  ),
  Math.ceil(
    ((e.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.height
  ));
  return res;
}

export function drawLine(
  from: vec2,
  to: vec2,
  color: string,
  ctx: CanvasRenderingContext2D
) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  ctx.closePath();
}

export function drawLines(
  points: vec2[],
  ctx: CanvasRenderingContext2D,
  color: string = "black"
) {
  for (let i = 0; i < points.length - 1; i++) {
    drawLine(points[i], points[i + 1], color, ctx);
  }
}

export function drawBezier(
  points: vec2[],
  segments: number,
  ctx: CanvasRenderingContext2D,
  color: string = "black"
) {
  let res = solveDeCasteljau(points, Number(segments) + 1);

  drawLines(res, ctx, color);

  // FIX: define new function:
  // ctx.strokeStyle = 'black';

  // drawBtn.disabled = true;
  // canvas.style.cursor = 'not-allowed';
}

export function fillCurve(
  points: vec2[],
  ctx: CanvasRenderingContext2D,
  min: vec2,
  max: vec2
) {
  fill(min, max, points, ctx);
}
export function fillGlyph(
  min: vec2,
  max: vec2,
  quadraticCurves: vec2[][],
  ctx: CanvasRenderingContext2D
) {
  for (let y = min[1]; y <= max[1]; y++) {
    for (let x = min[0]; x <= max[0]; x++) {
      let pos = vec2.fromValues(x, y);
      if (isInsideGlyph(pos, quadraticCurves)) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

export function fill(
  min: vec2,
  max: vec2,
  points: vec2[],
  ctx: CanvasRenderingContext2D
) {
  for (let y = min[1]; y <= max[1]; y++) {
    for (let x = min[0]; x <= max[0]; x++) {
      let pos = vec2.fromValues(x, y);
      let res = Math.round(sdBezier(pos, points));

      ctx.fillStyle =
        "rgb(255," +
        ((res * 2) % 256).toString() +
        "," +
        ((res * 5) % 256).toString() +
        " )";
      ctx.fillRect(x, y, 1, 1);
    }
  }
}
