import { vec2, vec3 } from "gl-matrix";
import { segments } from "./main";
import { normalizeVec3, vec3ToFloat32 } from "./math";
// TODO: back to vec2
const gamma = 0.5;

// not needed
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

// not needed.
export function solveDeCasteljau(points: vec3[], segments: number): vec3[] {
  let res: vec3[] = [];
  for (let i = 0; i < segments; i++) {
    res.push(deCasteljau(points, i / (segments == 1 ? 1 : segments - 1)));
  }
  return res;
}

// TODO: to shader?
export function cubicToQuadratic(cubicPoints: vec2[]): vec2[][] {
  if (cubicPoints.length !== 4) {
    throw new Error(
      "Cubic line needs to have 4 control points, now it has: " +
        cubicPoints.length.toString()
    );
  }
  // cubic curve is being split to 2 quadratics
  let quadraticPoints1: vec2[] = [vec2.create(), vec2.create(), vec2.create()];
  let quadraticPoints2: vec2[] = [vec2.create(), vec2.create(), vec2.create()];

  vec2.copy(quadraticPoints1[0], cubicPoints[0]);
  vec2.copy(quadraticPoints2[2], cubicPoints[3]);

  let diff = vec2.create();

  vec2.subtract(diff, cubicPoints[1], cubicPoints[0]);
  vec2.scale(diff, diff, 1.5 * gamma);
  vec2.add(quadraticPoints1[1], cubicPoints[0], diff);

  vec2.subtract(diff, cubicPoints[3], cubicPoints[2]);
  vec2.scale(diff, diff, 1.5 * (1 - gamma));
  vec2.subtract(quadraticPoints2[1], cubicPoints[3], diff);

  let a = vec2.create();
  let b = vec2.create();

  vec2.scale(a, quadraticPoints1[1], 1 - gamma);
  vec2.scale(b, quadraticPoints2[1], gamma);
  vec2.add(quadraticPoints1[2], a, b);

  vec2.copy(quadraticPoints2[0], quadraticPoints1[2]);

  return [quadraticPoints1, quadraticPoints2];
}

// TODO: delete later; no need
export function getBezier(vertices: vec3[]): Float32Array {
  if (vertices.length == 0) {
    return new Float32Array();
  }
  const allPoints: vec3[] = solveDeCasteljau(vertices, segments);
  let float32Array = new Float32Array(allPoints.length * 3);
  float32Array.fill(0);

  return vec3ToFloat32(allPoints);
}

// TODO: delete later
// no need for deCastaleju for GPU.
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
