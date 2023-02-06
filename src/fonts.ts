// parsing text
import { Typr } from "./Typr";
import { drawBezier, fillGlyph } from "./draw";
import { cubicToQuadratic } from "./bezier";
import { vec2 } from "gl-matrix";

async function loadFont(url: string) {
  const response: Response = await fetch(url);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const tables = Typr.parse(arrayBuffer);
  console.log(tables);
  return tables[0];
}

function getPosition(pos: number, crds: number[]): vec2 {
  return vec2.fromValues(crds[pos], crds[pos + 1]);
}
function parseShape(
  cmds: string[],
  crds: number[],
  ctx: CanvasRenderingContext2D,
  segments: number = 50
) {
  const scale = 350 / 1000;
  const x = 0;
  const y = 350;

  ctx.translate(x, y);
  ctx.scale(scale, -scale);

  let pos: number = 0;
  let points: vec2[] = [];
  let point: vec2, lastPoint: vec2, firstPoint: vec2;

  let quadraticCurves: vec2[][] = [];
  cmds.forEach((cmd) => {
    switch (cmd) {
      case "M":
        firstPoint = getPosition(pos, crds);
        ctx.moveTo(firstPoint[0], firstPoint[1]);
        lastPoint = firstPoint;
        pos += 2;
        break;
      case "L":
        point = getPosition(pos, crds);
        quadraticCurves.push([lastPoint, getMiddle(lastPoint, point), point]);
        ctx.lineTo(point[0], point[1]);
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
        ctx.lineTo(firstPoint[0], firstPoint[1]);
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

export function findMinMax(crds: number[]): vec2[] {
  let x, y;

  let xmin = Infinity;
  let ymin = Infinity;

  let xmax = -Infinity;
  let ymax = -Infinity;
  for (let i = 0; i < crds.length - 1; i = i + 2) {
    x = crds[i];
    y = crds[i + 1];
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
  return [vec2.fromValues(xmin, ymin), vec2.fromValues(xmax, ymax)];
}

function getMiddle(point1: vec2, point2: vec2): vec2 {
  const sum = vec2.create();
  const middle = vec2.create();

  vec2.add(sum, point1, point2);
  return vec2.divide(middle, sum, vec2.fromValues(2, 2));

}
