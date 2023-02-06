
import { vec2 } from "gl-matrix";
const gamma = 0.5;

function deCasteljau(points: vec2[], t: number): vec2 {
  if (points.length == 1) {
    return points[0];
  } else {
    let newpoints = [];
    for (let i = 0; i < points.length - 1; i++) {
        
        let x = (1 - t) * points[i][0] + t * points[i + 1][0];
        let y = (1 - t) * points[i][1] + t * points[i + 1][1];
        
      newpoints.push(vec2.fromValues(x, y));
    }
    return deCasteljau(newpoints, t);
  }
}

export function solveDeCasteljau(
  points: vec2[],
  segmentCount: number
): vec2[] {
  let res: vec2[] = [];
  for (let i = 0; i < segmentCount; i++) {
    res.push(
      deCasteljau(points, i / (segmentCount == 1 ? 1 : segmentCount - 1))
    );
  }
  return res;
}

export function cubicToQuadratic(cubicPoints: vec2[]): vec2[][] {
  if (cubicPoints.length !== 4) {
    throw new Error(
      "Cubic line needs to have 4 control points, now it has: " +
        cubicPoints.length.toString()
    );
  }
  // cubic curve is being split to 2 quadratics
  let quadraticPoints1: vec2[] = [];
  let quadraticPoints2: vec2[] = [];

  quadraticPoints1[0] = cubicPoints[0];
  quadraticPoints2[2] = cubicPoints[3];

  let diff = vec2.create();

  vec2.subtract(diff, cubicPoints[1], cubicPoints[0])
  vec2.scale(diff, diff, 1.5 * gamma)
  vec2.add(quadraticPoints1[1], cubicPoints[0], diff);

  vec2.subtract(diff, cubicPoints[3], cubicPoints[2])
  vec2.scale(diff, diff, 1.5 * (1 - gamma))
  vec2.subtract(quadraticPoints2[1], cubicPoints[3], diff);

  let a = vec2.create();
  let b = vec2.create();

  vec2.scale(a, quadraticPoints1[1], 1 - gamma);
  vec2.scale(b, quadraticPoints2[1], gamma);
  vec2.add(quadraticPoints1[2], a, b);
  
  vec2.copy(quadraticPoints2[0], quadraticPoints1[2]);

  return [quadraticPoints1, quadraticPoints2];
}


