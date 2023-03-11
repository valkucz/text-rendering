// parsing text
import { Typr } from "./Typr";
import { cubicToQuadratic } from "./bezier";
import { vec2 } from "gl-matrix";
// TODO: make class, move to fonts
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
function parseShapeToGlyph(cmds: string[], crds: number[]): vec2[][] {
  let pos: number = 0;
  let points: vec2[] = [];

  let point = vec2.create();
  let lastPoint = vec2.create();
  let firstPoint = vec2.create();

  let quadraticCurves: vec2[][] = [];
  cmds.forEach((cmd) => {
    switch (cmd) {
      case "M":
        firstPoint = getPosition(pos, crds);
        vec2.copy(lastPoint, firstPoint);
        pos += 2;
        break;
      case "L":
        point = getPosition(pos, crds);
        quadraticCurves.push([
          vec2.fromValues(lastPoint[0], lastPoint[1]),
          getMiddle(lastPoint, point),
          vec2.fromValues(point[0], point[1]),
        ]);
        vec2.copy(lastPoint, point);
        pos += 2;
        break;
      case "C":
        for (let i = pos - 2; i < pos + 6; i += 2) {
          points.push(getPosition(i, crds));
        }
        vec2.copy(lastPoint, points[3]);
        // approximation
        // FIX: middle point 2times rendered
        cubicToQuadratic(points).forEach((qpoints) => {
          // fillCurve(qpoints, ctx);
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
        vec2.copy(lastPoint, points[2]);
        points = [];
        pos += 4;
        break;
      case "Z":
        quadraticCurves.push([
          vec2.fromValues(lastPoint[0], lastPoint[1]),
          getMiddle(lastPoint, firstPoint),
          vec2.fromValues(firstPoint[0], firstPoint[1]),
        ]);
        break;
      default:
        break;
    }
  });

  return quadraticCurves;
}

export async function parseText(text: string): Promise<vec2[][]> {
  const font = await loadFont("./Blogger_Sans.otf");
  const shape = Typr.U.shape(font, text, true);
  const path = Typr.U.shapeToPath(font, shape);

  const glyph = parseShapeToGlyph(path.cmds, path.crds);
  const minmax = findMinMax(path.crds);
  console.log('Min max: ', minmax);
  return [minmax].concat(glyph);
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
  const res = vec2.create();

  vec2.add(res, point1, point2);
  vec2.scale(res, res, 0.5);
  return res;
}
