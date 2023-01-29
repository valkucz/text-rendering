import { abs, pow, sign } from 'mathjs';
import { solveDeCasteljau, cubicToQuadratic, clamp } from './decasteljau'

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
    divide(c: number) : Point {
      return new Point(this.x / c, this.y / c);
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
    dot(point: Point):number{
      return this.x * point.x + this.y * point.y;
    }
    dot2():number{
      return this.dot(this);
    }
    sign() {
      return new Point(sign(this.x), sign(this.y));
    }
    abs() {
      return new Point(abs(this.x), abs(this.y));
    }
    pow(point: Point) {
      return new Point (this.x ** point.x, this.y ** point.y);
    }
    clamp(minimum: number, maximum: number) {
      return new Point(clamp(this.x, minimum, maximum), clamp(this.y, minimum, maximum));
    }
    length(): number {
      return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    not() {
      return new Point(~this.x, ~this.y);
    }
    and(point: Point) {
      return new Point(this.x & point.x, this.y & point.y);
    }
    or(point: Point) {
      return new Point(this.x | point.x, this.y | point.y);
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
  
export function drawLines(points: Point[], ctx: CanvasRenderingContext2D, color: string = 'black'){
    for (let i = 0; i < points.length - 1; i++) {
        drawLine(points[i], points[i + 1], color, ctx);
    }
}

export function drawBezier(points: Point[], segments: number, ctx: CanvasRenderingContext2D, color: string = 'black'){
  let res = solveDeCasteljau(points, Number(segments) + 1);

  drawLines(res, ctx, color);
  
  // FIX: define new function:
  // ctx.strokeStyle = 'black';

  // drawBtn.disabled = true;
  // canvas.style.cursor = 'not-allowed';
}