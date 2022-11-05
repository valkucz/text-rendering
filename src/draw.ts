import { solveDeCasteljau, cubicToQuadratic } from './decasteljau'

export class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    multiply(c: number): Point {
      return new Point(this.x * c, this.y * c);
    }
    add(point: Point): Point {
      return new Point(this.x + point.x, this.y + point.y);
    }
    substract(point: Point): Point {
      return new Point(this.x - point.x, this.y - point.y);
    }
    multiplyPoint(point: Point): Point {
      return new Point(this.x * point.x, this.y * point.y);
    }
  }
  
export function getCanvasPoint(e: MouseEvent, canvas: HTMLCanvasElement){
    let rect = canvas.getBoundingClientRect();
    return new Point( 
        Math.ceil((e.clientX - rect.left) / (rect.right - rect.left) * canvas.width),
        Math.ceil((e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height)
    )
  }
  
export function drawLine (from: Point, to: Point, color: string, ctx: CanvasRenderingContext2D){
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.closePath();
  }
  
export function drawLines(points: Point[], ctx: CanvasRenderingContext2D){
    for (let i = 0; i < points.length - 1; i++) {
        drawLine(points[i], points[i + 1], 'black', ctx);
    }
}
export function drawBezier(points: Point[], segments: number, ctx: CanvasRenderingContext2D){
  let res = solveDeCasteljau(points, Number(segments) + 1);

  drawLines(res, ctx);
  
  // FIX: define new function:
  // ctx.strokeStyle = 'black';

  // drawBtn.disabled = true;
  // canvas.style.cursor = 'not-allowed';
}