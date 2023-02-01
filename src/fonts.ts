// parsing text
import { Typr } from "./Typr";
import { Point, drawBezier, fillGlyph } from "./draw";
import { cubicToQuadratic } from "./bezier";

async function loadFont(url: string) {
  const response: Response = await fetch(url);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const tables = Typr.parse(arrayBuffer);
  console.log(tables);
  return tables[0];
}

function getPosition(pos: number, crds: number[], koef: number = 1) {
  return new Point(crds[pos] / koef, crds[pos + 1] / koef);
}
function parseShape(
  cmds: string[],
  crds: number[],
  ctx: CanvasRenderingContext2D,
  segments: number = 50
) {
  console.log(crds, cmds);
  const scale: number = 350 / 1000;
  const x = 0;
  const y = 350;

  ctx.translate(x, y);
  ctx.scale(scale, -scale);

  let pos: number = 0;
  let points: Point[] = [];
  let point: Point, lastPoint: Point, firstPoint: Point;

  let quadraticCurves: Point[][] = [];
  cmds.forEach((cmd) => {
    switch (cmd) {
      case "M":
        firstPoint = getPosition(pos, crds);
        ctx.moveTo(firstPoint.x, firstPoint.y);
        lastPoint = firstPoint;
        pos += 2;
        break;
      case "L":
        point = getPosition(pos, crds);
        quadraticCurves.push([lastPoint, getMiddle(lastPoint, point), point]);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        lastPoint = point;
        pos += 2;
        break;
      case "C":
        for (let i = pos - 2; i < pos + 6; i += 2) {
          points.push(getPosition(i, crds));
        }
        lastPoint = points[3];
        // approximation
        // FIX: middle point 2times rendered
        cubicToQuadratic(points).forEach((qpoints) => {
          // fillCurve(qpoints, ctx);
          drawBezier(qpoints, segments, ctx);
          quadraticCurves.push(qpoints);
        });
        points = [];
        pos += 6;
        break;
      case "Q":
        for (let i = pos - 2; i < pos + 4; i += 2) {
          points.push(getPosition(i, crds));
        }
        quadraticCurves.push(points);
        drawBezier(points, segments, ctx);
        lastPoint = points[2];
        points = [];
        pos += 4;
        break;
      case "Z":
        ctx.lineTo(firstPoint.x, firstPoint.y);
        ctx.stroke();
        ctx.closePath();
        quadraticCurves.push([
          lastPoint,
          getMiddle(lastPoint, firstPoint),
          firstPoint,
        ]);
        break;
      default:
        break;
    }
  });

  let minmax = findMinMax(crds);
  fillGlyph(minmax[0], minmax[1], quadraticCurves, ctx);

  ctx.scale(1 / scale, -1 / scale);
  ctx.translate(-x, -y);
}

export async function parseText(ctx: CanvasRenderingContext2D, text: string) {
  const font = await loadFont("./MontserratAlternates-Medium.otf");
  const shape = Typr.U.shape(font, text, true);
  const path = Typr.U.shapeToPath(font, shape);

  parseShape(path.cmds, path.crds, ctx);
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

function getMiddle(point1: Point, point2: Point): Point {
  return new Point((point1.x + point2.x) / 2, (point1.y + point2.y) / 2);
}
