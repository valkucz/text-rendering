import { vec3 } from "gl-matrix";
import { segments } from "./main";
import { normalizeVec3 } from "./math";

const gamma = 0.5;

function deCasteljau(points: vec3[], t: number): vec3 {
  if (points.length == 1) {
    return points[0];
  } else {
    let newpoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      let x = (1 - t) * points[i][0] + t * points[i + 1][0];
      let y = (1 - t) * points[i][1] + t * points[i + 1][1];
      let z = (1 - t) * points[i][2] + t * points[i + 1][2];

      newpoints.push(vec3.fromValues(x, y, z));
    }
    return deCasteljau(newpoints, t);
  }
}

export function solveDeCasteljau(points: vec3[], segments: number): vec3[] {
  let res: vec3[] = [];
  for (let i = 0; i < segments; i++) {
    res.push(deCasteljau(points, i / (segments == 1 ? 1 : segments - 1)));
  }
  return res;
}

export function cubicToQuadratic(cubicPoints: vec3[]): vec3[][] {
  if (cubicPoints.length !== 4) {
    throw new Error(
      "Cubic line needs to have 4 control points, now it has: " +
        cubicPoints.length.toString()
    );
  }
  // cubic curve is being split to 2 quadratics
  let quadraticPoints1: vec3[] = [vec3.create(), vec3.create(), vec3.create()];
  let quadraticPoints2: vec3[] = [vec3.create(), vec3.create(), vec3.create()];

  vec3.copy(quadraticPoints1[0], cubicPoints[0]);
  vec3.copy(quadraticPoints2[2], cubicPoints[3]);

  let diff = vec3.create();

  vec3.subtract(diff, cubicPoints[1], cubicPoints[0]);
  vec3.scale(diff, diff, 1.5 * gamma);
  vec3.add(quadraticPoints1[1], cubicPoints[0], diff);

  vec3.subtract(diff, cubicPoints[3], cubicPoints[2]);
  vec3.scale(diff, diff, 1.5 * (1 - gamma));
  vec3.subtract(quadraticPoints2[1], cubicPoints[3], diff);

  let a = vec3.create();
  let b = vec3.create();

  vec3.scale(a, quadraticPoints1[1], 1 - gamma);
  vec3.scale(b, quadraticPoints2[1], gamma);
  vec3.add(quadraticPoints1[2], a, b);

  vec3.copy(quadraticPoints2[0], quadraticPoints1[2]);

  return [quadraticPoints1, quadraticPoints2];
}

export function getBezier(vertices: vec3[]): Float32Array {
  if (vertices.length == 0) {
    return new Float32Array();
  }
  const allPoints: vec3[] = solveDeCasteljau(vertices, segments);
  const normalizedPoints: vec3[] = allPoints.map((point) =>
    normalizeVec3(point)
  );

  let float32Array = new Float32Array(normalizedPoints.length * 6);
  float32Array.fill(0);

  for (let i = 0; i < allPoints.length; i++) {
    float32Array[i * 6] = normalizedPoints[i][0];
    float32Array[i * 6 + 1] = normalizedPoints[i][1];
    float32Array[i * 6 + 2] = normalizedPoints[i][2];
  }
  return float32Array;
}

export function getBezierGlyph(glyph: vec3[][]): Float32Array {

  const length = glyph.length * segments * 5;

  const combined = new Float32Array(length);
  let offset = 0;

  return glyph.map(vertices => getBezier(vertices)).reduce((acc, curr) => {
    acc.set(curr, offset);
    offset += curr.length;
    return acc;

  }, combined)
}
