// parsing text
import { Typr } from './Typr';
import { Point, drawBezier } from './draw'
import { cubicToQuadratic, sdBezier, sdLine, isInsideGlyph } from './decasteljau';
import { min } from 'mathjs';

async function loadFont(url: string){
    const response: Response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const tables = Typr.parse(arrayBuffer);
    console.log(tables);
    return tables[0];
  }

function getPosition(pos: number, crds: number[], koef: number = 1){
    return new Point(crds[pos] / koef, (crds[pos + 1])/ koef);
}
function parseShape(cmds: string[], crds: number[], canvasController: CanvasController, segments: number = 50): Point[][]{
    console.log(crds, cmds);
    const ctx = canvasController.ctx;
    // ctx.scale(1, -1);
    let pos: number = 0;
    let points: Point[] = [];
    let point;
    // const koef: number = 4;
    const scale: number = 350 / 1000;
    const x = 0;
    const y = 350;
    // ctx.translate(x,y);
    // ctx.scale(scale,-scale);

    let firstPoint = getPosition(0, crds);
    let lastPoint = firstPoint;

    // first point on curve
    let quadraticCurves: Point[][] = [];

    cmds.forEach(cmd => {
      switch(cmd){
        case 'M':
            firstPoint = getPosition(pos, crds);
            // fillLine(lastPoint, firstPoint, ctx);
            ctx.moveTo(firstPoint.x, firstPoint.y);
            pos += 2;
            break;
        case 'L':
            point = getPosition(pos, crds);
            // fillLine(lastPoint, point, ctx);

            ctx.lineTo(point.x, point.y);
            ctx.stroke();

            quadraticCurves.push([lastPoint,  getMiddle(lastPoint, point), firstPoint]);

            lastPoint = point;
            pos += 2;
            break;
        case 'C':
            points.push(getPosition(pos - 2, crds));
            for(let i = pos; i < pos + 6; i +=2){
              points.push(getPosition(i, crds));
            }
            lastPoint = points[3];

            // approximation

            // FIX: middle point 2times rendered
            cubicToQuadratic(points)
              .forEach(qpoints =>
                {
                  // fillCurve(qpoints, ctx);
                  drawBezier(qpoints, segments, ctx);
                  quadraticCurves.push(qpoints);
                }
                );

            // drawBezier(points, segments, ctx);
            points = [];
            pos += 6;
            break;
        case 'Q':
            points.push(getPosition(pos - 2, crds));
            for(let i = pos; i < pos + 4; i +=2){
              points.push(getPosition(i, crds));
            }

            // fillCurve(points, ctx);
            drawBezier(points, segments, ctx);
            quadraticCurves.push(points);

            lastPoint = points[2];

            points = [];
            pos += 4;
            break;
        case 'Z':
            // fillLine(lastPoint, firstPoint, ctx);
            ctx.lineTo(firstPoint.x, firstPoint.y);
            ctx.stroke();

            quadraticCurves.push([lastPoint, getMiddle(lastPoint, firstPoint), firstPoint]);
            break;
        default: break;
      }
    }
    )

    let minmax = findMinMax(crds);

    fillGlyph(minmax[0], minmax[1], quadraticCurves, ctx);

    console.log(quadraticCurves);
    // ctx.scale(1/scale,-1/scale);
    // ctx.translate(-x,-y);
  }

  export async function parseText(canvasController: CanvasController, letter: string){
    
    const font = await loadFont('./MontserratAlternates-Medium.otf');
    let shape = Typr.U.shape(font, letter, true);
    let path = Typr.U.shapeToPath(font, shape);
    
    // const ctx = canvasController.ctx;
    // var scale = 2 / font.head.unitsPerEm;
    // const scale: number = 350 / 1000;
    // const x = 200;
    // const y = 200;

    // ctx.translate(x,y);
    // ctx.scale(scale,-scale);
    // ctx.translate(3500,500);  ctx.rotate(0.25);  ctx.scale(1,-1);
    // ctx.fillStyle = 'black';

    // Typr.U.pathToContext(path, ctx);

    // ctx.scale(1/scale,-1/scale);
    // ctx.translate(-x,-y);
    // test case
    // parseShape(["M", "Q", "Q"], [100,100, 250,100, 350,200, 450, 300, 500, 500], ctx);

    parseShape(path.cmds, path.crds, canvasController);
  }

  export function findMinMax(crds: number[], koef: number = 1): Point[] {
    let x, y;

    let xmin = Infinity;
    let ymin = Infinity;

    let xmax = -Infinity;
    let ymax = -Infinity;
    for (let i = 0; i < crds.length - 1; i = i + 2) {
      x = crds[i] / koef;
      y = crds[i + 1] / koef;
      if (x < xmin) { 
        xmin = x;
      }
      if (x > xmax) { 
        xmax = x;
      }
      if (y < ymin) { 
        ymin = y;
      }
      if (y > ymax) { 
        ymax = y;
      }
    }
    return [new Point(xmin, ymin), new Point(xmax, ymax)];
  }
  
export function fillLine(a: Point, b: Point, ctx: CanvasRenderingContext2D) {
  const koef = 40;
  let min = new Point(Math.min(a.x, b.x) - koef, Math.min(a.y, b.y) - koef);
  let max = new Point(Math.max(a.x, b.x) + koef, Math.max(a.y, b.y) + koef);

  for (let y = min.y; y <= max.y; y++) {
    for (let x = min.x; x <= max.x; x++) {
      let pos = new Point(x, y);
      let res = Math.round(sdLine(pos, a, b));

      ctx.fillStyle = 'rgb(255,' + (res * 2 % 256).toString() + ',' + (res * 5 % 256).toString() + ' )';
      ctx.fillRect(pos.x, pos.y, 1,1);
    }
  }
}

function fillCurve(points: Point[], ctx: CanvasRenderingContext2D) {
  let minmax = findMinMax(points.map(point => [point.x, point.y]).flat());
  console.log(minmax);
  fill(minmax[0], minmax[1], points, ctx);
}

  export function fill(min: Point, max: Point, points: Point[], ctx: CanvasRenderingContext2D) {
    for (let y = min.y; y <= max.y; y++) {
      for (let x = min.x; x <= max.x; x++) {
        let pos = new Point(x, y);
        let res = Math.round(sdBezier(pos, points));

        ctx.fillStyle = 'rgb(255,' + (res * 2 % 256).toString() + ',' + (res * 5 % 256).toString() + ' )';
        ctx.fillRect(pos.x, pos.y, 1,1);
      }
    }
  }

function getMiddle(point1: Point, point2: Point): Point {
  return new Point((point1.x + point2.x) / 2, (point1.y + point2.y) / 2);
}

function fillGlyph(min: Point, max: Point, quadraticCurves: Point[][], ctx: CanvasRenderingContext2D) {

  for (let y = min.y; y <= max.y; y++) {
    for (let x = min.x; x <= max.x; x++) {

      let pos = new Point(x, y);
      if (isInsideGlyph(pos, quadraticCurves)) {
        ctx.fillRect(pos.x, pos.y, 1,1);
      }
      // sdf
      // if inside: fill;

    }
  }
}