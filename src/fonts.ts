// parsing text
import { Typr } from "./Typr";
import { Point, drawBezier, fillGlyph } from "./draw";
import { cubicToQuadratic, sdBezier } from "./decasteljau";

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
          //drawBezier(qpoints, segments, ctx);
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

  console.log('curves', quadraticCurves);

  // Normalize curves
  let minmax = findMinMax(crds); // Find bounding box
  let min = minmax[0];
  let max = minmax[1];

  // Find center by which all the points are moved to be centered
  // around point [0, 0]
  let center = new Point(0.5 * (max.x + min.x), 0.5 * (max.y - min.y));
  let scale = Math.max(Math.abs(max.x - min.x), Math.abs(max.y - min.y));

  const normalizedCurves = quadraticCurves.map(cs => cs.map(c => new Point(
    (c.x - center.x) / scale,
    (c.y - center.y) / scale,
  )));

  console.log(normalizedCurves);

  // Calculate projected curves
  const projectedCurves = normalizedCurves.map(cs => cs.map(c => new Point(
    c.x * 128 + innerWidth * 0.5,
    c.y * 128 + innerHeight * 0.5,
  )));

  // Draw bounding box of projected curves
  let minBoundingBox = new Point(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  let maxBoundingBox = new Point(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
  projectedCurves.forEach(cs => cs.forEach(c => {
    minBoundingBox.x = Math.min(minBoundingBox.x, c.x);
    minBoundingBox.y = Math.min(minBoundingBox.y, c.y);

    maxBoundingBox.x = Math.max(maxBoundingBox.x, c.x);
    maxBoundingBox.y = Math.max(maxBoundingBox.y, c.y);
  }));
  minBoundingBox.x -= 64;
  minBoundingBox.y -= 64;
  maxBoundingBox.x += 64;
  maxBoundingBox.y += 64;

  ctx.strokeStyle = 'purple';
  ctx.strokeRect(
    minBoundingBox.x, minBoundingBox.y,
    maxBoundingBox.x - minBoundingBox.x, maxBoundingBox.y - minBoundingBox.y);

  // Draw absolute shortest distance
  let id = ctx.getImageData(0, 0, 1356, 681);
  let pixels = id.data;

  for (let x = minBoundingBox.x; x < maxBoundingBox.x; x++) {
    for (let y = minBoundingBox.y; y < maxBoundingBox.y; y++) {
      let i = (Math.round(y) * id.width + Math.round(x)) * 4;

      let minDist = 100000.0;
      for (const curve of projectedCurves.slice(0, 8)) {
        let point = new Point(x, y);

        minDist = Math.min(minDist, Math.abs(sdBezier(point, curve)));
      }
      minDist = Math.round(minDist);

      // console.log(x, y, i, minDist);

      pixels[i]     = minDist; // R
      pixels[i + 1] = minDist; // G
      pixels[i + 2] = minDist; // B
      pixels[i + 3] = 255;     // A
    }
  }

  ctx.putImageData(id, 0, 0);

  // Draw control points/lines of curves
  ctx.strokeStyle = 'cyan';
  for (const curve of projectedCurves.slice(0, 8)) {
    ctx.moveTo(curve[0].x, curve[0].y);
    ctx.lineTo(curve[1].x, curve[1].y);
    ctx.lineTo(curve[2].x, curve[2].y);
    ctx.stroke();
    ctx.closePath();
  }

  console.log('done');
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
